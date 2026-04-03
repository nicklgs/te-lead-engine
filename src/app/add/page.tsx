'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CategoryId, LeadSource, Lead } from '@/lib/types';
import { CATEGORIES, ZIP_TIERS, SOURCE_TYPES } from '@/lib/constants';
import { scoreLead } from '@/lib/scoring';
import ScoreBar from '@/components/ScoreBar';

export default function AddLeadPage() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [zip, setZip] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('tx');
  const [source, setSource] = useState<LeadSource>('manual');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const previewLead = useMemo(() => {
    if (!address || !zip) return null;
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    const mockLead: Lead = {
      id: 'preview', title: address, category: cat?.label || '', categoryId, location: zip, zip,
      details: notes, sourceUrl: '', source, stage: 'new', followUp: null,
      stackedCategories: [categoryId], stackedLabels: [cat?.label || ''], stackCount: 1,
      isDuplicate: false, stackedInto: null, skipTrace: null, comps: null, offer: null,
      activities: [], createdAt: new Date(), updatedAt: new Date(),
    };
    const { score, tier } = scoreLead(mockLead);
    return { score, tier };
  }, [address, zip, categoryId, source, notes]);

  const handleSubmit = async () => {
    if (!address.trim() || !zip) return;
    setSaving(true);
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    const zipInfo = ZIP_TIERS.find((z) => z.zip === zip);
    const newLead = {
      title: address, category: cat?.label || '', categoryId,
      location: (zipInfo?.area || '') + ', PA ' + zip, zip, details: notes,
      sourceUrl: '', source, stage: 'new' as const, followUp: null,
      stackedCategories: [categoryId], stackedLabels: [cat?.label || ''], stackCount: 1,
      isDuplicate: false, stackedInto: null, skipTrace: null, comps: null, offer: null,
      activities: [{ id: 1, type: 'note' as const, text: 'Lead added manually via ' + (SOURCE_TYPES.find((s) => s.id === source)?.label || source), date: new Date() }],
    };
    try { const { addLead } = await import('@/lib/firebase'); await addLead(newLead); } catch { /* demo mode */ }
    setSaving(false); setSuccess(true);
    setTimeout(() => router.push('/leads'), 1500);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#2D7A4F]/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl text-[#2D7A4F]">{'\u2713'}</span>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A4A] font-[family-name:var(--font-heading)]">Lead Added!</h2>
          <p className="text-sm text-gray-500 mt-1">Redirecting to leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-5">Add New Lead</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Property Address *</label>
          <input type="text" placeholder="123 Main St, Chester, PA" value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] focus:border-[#B8985A] outline-none" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Zip Code *</label>
          <select value={zip} onChange={(e) => setZip(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] outline-none">
            <option value="">Select zip code...</option>
            {[1, 2, 3].map((tier) => (
              <optgroup key={tier} label={"Tier " + tier}>
                {ZIP_TIERS.filter((z) => z.tier === tier).map((z) => (<option key={z.zip} value={z.zip}>{z.zip} - {z.area}</option>))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                className={"flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors " + (categoryId === cat.id ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
                <span>{cat.icon}</span><span className="font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Source</label>
          <div className="flex flex-wrap gap-2">
            {SOURCE_TYPES.map((s) => (
              <button key={s.id} onClick={() => setSource(s.id)}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors " + (source === s.id ? "bg-[#B8985A] text-white border-[#B8985A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
                <span>{s.icon}</span><span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Property details, condition, motivation level..."
            rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#B8985A] outline-none" />
        </div>

        {previewLead && (
          <div className="bg-[#F4EFE7] rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Score Preview</p>
            <ScoreBar score={previewLead.score} tier={previewLead.tier} size="lg" />
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving || !address.trim() || !zip}
          className="w-full py-3 bg-[#1B2A4A] text-white rounded-lg font-bold text-sm hover:bg-[#2a3d66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? 'Saving...' : 'Add Lead'}
        </button>
      </div>
    </div>
  );
}
