'use client';

import { useState, useEffect } from 'react';
import type { Buyer, BuyerType } from '@/lib/types';
import { BUYER_TYPES, ZIP_TIERS } from '@/lib/constants';


const TYPE_COLORS: Record<BuyerType, string> = { flipper: '#f59e0b', landlord: '#3b82f6', developer: '#8b5cf6', hedge_fund: '#10b981' };

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [findLoading, setFindLoading] = useState(false);
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<BuyerType>('flipper');
  const [formRange, setFormRange] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    async function loadBuyers() {
      try { const { getBuyers } = await import('@/lib/firebase'); const fb = await getBuyers(); setBuyers(fb); } catch { setBuyers([]); } finally { setLoading(false); }
    }
    loadBuyers();
  }, []);

  const handleFindBuyers = async () => {
    if (selectedZips.length === 0) return; setFindLoading(true);
    try {
      const res = await fetch('/api/find-buyers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zips: selectedZips }) });
      const data = await res.json();
      if (data.buyers) { const newBuyers = data.buyers.map((b: Buyer, i: number) => ({ ...b, id: 'new-' + Date.now() + '-' + i, createdAt: new Date() })); setBuyers((prev) => [...newBuyers, ...prev]); }
    } catch { /* demo */ } finally { setFindLoading(false); }
  };

  const handleAddBuyer = async () => {
    if (!formName.trim()) return;
    const newBuyer: Buyer = { id: 'manual-' + Date.now(), name: formName, type: formType, priceRange: formRange, properties: '', contact: formContact, notes: formNotes, createdAt: new Date() };
    setBuyers((prev) => [newBuyer, ...prev]);
    try { const { addBuyer } = await import('@/lib/firebase'); await addBuyer(newBuyer); } catch { /* demo */ }
    setFormName(''); setFormRange(''); setFormContact(''); setFormNotes(''); setShowAddForm(false);
  };

  if (loading) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-[#B8985A] border-t-transparent rounded-full animate-spin mx-auto" /></div>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Cash Buyers</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="text-sm bg-[#1B2A4A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2a3d66] transition-colors">
          {showAddForm ? 'Cancel' : '+ Add Buyer'}
        </button>
      </div>

      {/* Find buyers */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Find Cash Buyers</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ZIP_TIERS.filter((z) => z.tier <= 2).map((z) => (
            <label key={z.zip} className={"flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer border transition-colors " + (selectedZips.includes(z.zip) ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200")}>
              <input type="checkbox" checked={selectedZips.includes(z.zip)} onChange={(e) => setSelectedZips(e.target.checked ? [...selectedZips, z.zip] : selectedZips.filter((x) => x !== z.zip))} className="sr-only" />
              {z.zip}
            </label>
          ))}
        </div>
        <button onClick={handleFindBuyers} disabled={findLoading || selectedZips.length === 0} className="bg-[#B8985A] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#a0823e] transition-colors disabled:opacity-40">
          {findLoading ? 'Searching...' : 'Find Cash Buyers'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
          <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Add Buyer Manually</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Buyer Name / LLC" value={formName} onChange={(e) => setFormName(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] outline-none" />
            <select value={formType} onChange={(e) => setFormType(e.target.value as BuyerType)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] outline-none">
              {BUYER_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
            </select>
            <input type="text" placeholder="Price Range (e.g. $60K - $150K)" value={formRange} onChange={(e) => setFormRange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] outline-none" />
            <input type="text" placeholder="Contact (phone or email)" value={formContact} onChange={(e) => setFormContact(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] outline-none" />
            <textarea placeholder="Notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#B8985A] outline-none" />
          </div>
          <button onClick={handleAddBuyer} disabled={!formName.trim()} className="mt-3 bg-[#2D7A4F] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#246842] transition-colors disabled:opacity-40">Save Buyer</button>
        </div>
      )}

      {/* Buyer list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buyers.map((buyer) => (
          <div key={buyer.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-bold text-[#1B2A4A]">{buyer.name}</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: TYPE_COLORS[buyer.type] || '#6b7280' }}>{buyer.type.replace('_', ' ')}</span>
            </div>
            {buyer.priceRange && <p className="text-xs text-gray-500 mb-1">Range: <span className="font-medium text-[#1B2A4A]">{buyer.priceRange}</span></p>}
            {buyer.properties && <p className="text-xs text-gray-500 mb-1">{buyer.properties}</p>}
            {buyer.contact && <a href={"tel:" + buyer.contact} className="text-xs text-[#2D7A4F] font-medium hover:underline block mb-1">{buyer.contact}</a>}
            {buyer.notes && <p className="text-xs text-gray-400 mt-1">{buyer.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
