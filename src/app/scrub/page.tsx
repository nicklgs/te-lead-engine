'use client';

import { useState, useEffect } from 'react';
import type { ScrubHistory } from '@/lib/types';
import { CATEGORIES, ZIP_TIERS } from '@/lib/constants';

export default function ScrubPage() {
  const [selectedZips, setSelectedZips] = useState<Set<string>>(new Set());
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ found: number; newLeads: number; duration: number } | null>(null);
  const [history, setHistory] = useState<ScrubHistory[]>([]);

  useEffect(() => {
    async function loadHistory() {
      try { const { getScrubHistory } = await import('@/lib/firebase'); const h = await getScrubHistory(); if (h.length > 0) setHistory(h); } catch { /* demo */ }
    }
    loadHistory();
  }, []);

  const toggleZip = (zip: string) => { const next = new Set(selectedZips); if (next.has(zip)) next.delete(zip); else next.add(zip); setSelectedZips(next); };

  const selectTier = (tier: number) => {
    const tierZips = ZIP_TIERS.filter((z) => z.tier === tier).map((z) => z.zip);
    const allSelected = tierZips.every((z) => selectedZips.has(z));
    const next = new Set(selectedZips);
    tierZips.forEach((z) => allSelected ? next.delete(z) : next.add(z));
    setSelectedZips(next);
  };

  const toggleCat = (catId: string) => { const next = new Set(selectedCats); if (next.has(catId)) next.delete(catId); else next.add(catId); setSelectedCats(next); };

  const selectAllCats = () => {
    const allSelected = CATEGORIES.every((c) => selectedCats.has(c.id));
    setSelectedCats(allSelected ? new Set() : new Set(CATEGORIES.map((c) => c.id)));
  };

  const handleScrub = async () => {
    if (selectedZips.size === 0 || selectedCats.size === 0) return;
    setRunning(true); setResult(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/scrub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zips: [...selectedZips], categories: [...selectedCats] }) });
      const data = await res.json();
      const duration = Math.round((Date.now() - start) / 1000);
      setResult({ found: data.leadsFound || 0, newLeads: data.newLeads || 0, duration });
    } catch {
      setResult({ found: 0, newLeads: 0, duration: Math.round((Date.now() - start) / 1000) });
    } finally { setRunning(false); }
  };

  const tier1 = ZIP_TIERS.filter((z) => z.tier === 1);
  const tier2 = ZIP_TIERS.filter((z) => z.tier === 2);
  const tier3 = ZIP_TIERS.filter((z) => z.tier === 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-5">Scrub Engine</h1>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Zip codes */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Zip Codes</h3>
          {[{ label: 'Tier 1 (Priority)', tier: 1, zips: tier1 }, { label: 'Tier 2', tier: 2, zips: tier2 }, { label: 'Tier 3', tier: 3, zips: tier3 }].map(({ label, tier, zips }) => (
            <div key={tier} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600">{label}</span>
                <button onClick={() => selectTier(tier)} className="text-[10px] text-[#B8985A] hover:underline">
                  {zips.every((z) => selectedZips.has(z.zip)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {zips.map((z) => (
                  <label key={z.zip} className={"flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer border transition-colors " + (selectedZips.has(z.zip) ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
                    <input type="checkbox" checked={selectedZips.has(z.zip)} onChange={() => toggleZip(z.zip)} className="sr-only" />
                    {z.zip} <span className="text-[10px] opacity-70">{z.area}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Categories</h3>
            <button onClick={selectAllCats} className="text-[10px] text-[#B8985A] hover:underline">
              {CATEGORIES.every((c) => selectedCats.has(c.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <label key={cat.id} className={"flex items-center gap-2 px-3 py-2 rounded cursor-pointer border transition-colors " + (selectedCats.has(cat.id) ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
                <input type="checkbox" checked={selectedCats.has(cat.id)} onChange={() => toggleCat(cat.id)} className="sr-only" />
                <span className="text-sm">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleScrub} disabled={running || selectedZips.size === 0 || selectedCats.size === 0}
        className="w-full py-3 bg-[#B8985A] text-white rounded-lg font-bold text-sm hover:bg-[#a0823e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6">
        {running ? (<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Running Scrub...</span>) : ('Run Scrub (' + selectedZips.size + ' zips, ' + selectedCats.size + ' categories)')}
      </button>

      {result && (
        <div className="bg-[#2D7A4F]/10 border border-[#2D7A4F]/20 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold text-[#2D7A4F] mb-2">Scrub Complete</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-[#1B2A4A]">{result.found}</p><p className="text-xs text-gray-500">Leads Found</p></div>
            <div><p className="text-2xl font-bold text-[#2D7A4F]">{result.newLeads}</p><p className="text-xs text-gray-500">New Leads</p></div>
            <div><p className="text-2xl font-bold text-[#B8985A]">{result.duration}s</p><p className="text-xs text-gray-500">Duration</p></div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Recent Scrub History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-xs text-gray-500">Date</th><th className="text-right py-2 text-xs text-gray-500">Zips</th><th className="text-right py-2 text-xs text-gray-500">Categories</th><th className="text-right py-2 text-xs text-gray-500">Found</th><th className="text-right py-2 text-xs text-gray-500">New</th></tr></thead>
              <tbody>{history.slice(0, 10).map((h) => (<tr key={h.id} className="border-b border-gray-100"><td className="py-2">{new Date(h.date).toLocaleDateString()}</td><td className="py-2 text-right">{h.zipsSearched.length}</td><td className="py-2 text-right">{h.categoriesSearched.length}</td><td className="py-2 text-right font-medium">{h.leadsFound}</td><td className="py-2 text-right font-medium text-[#2D7A4F]">{h.newLeads}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
