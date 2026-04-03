'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Lead, CategoryId } from '@/lib/types';
import { CATEGORIES, STAGES, ZIP_TIERS } from '@/lib/constants';
import { scoreLead } from '@/lib/scoring';
import { DEMO_LEADS } from '@/lib/demo-data';
import LeadCard from '@/components/LeadCard';

function applyScores(leads: Lead[]): Lead[] {
  return leads.map((lead) => {
    const { score, tier } = scoreLead(lead);
    return { ...lead, score, scoreTier: tier };
  });
}

type SortKey = 'score' | 'newest' | 'oldest' | 'followup';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterZip, setFilterZip] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stage')) setFilterStage(params.get('stage')!);
    if (params.get('sort')) setSortBy(params.get('sort') as SortKey);

    async function loadLeads() {
      try {
        const { getLeads } = await import('@/lib/firebase');
        const fbLeads = await getLeads();
        if (fbLeads.length > 0) {
          setLeads(applyScores(fbLeads));
        } else {
          setLeads(applyScores(DEMO_LEADS));
        }
      } catch {
        setLeads(applyScores(DEMO_LEADS));
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    let result = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.details.toLowerCase().includes(q)
      );
    }
    if (filterStage !== 'all') result = result.filter((l) => l.stage === filterStage);
    if (filterCategory !== 'all') result = result.filter((l) => l.stackedCategories.includes(filterCategory as CategoryId));
    if (filterZip !== 'all') result = result.filter((l) => l.zip === filterZip);
    if (filterTier !== 'all') result = result.filter((l) => l.scoreTier === filterTier);

    switch (sortBy) {
      case 'score': result.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); break;
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'oldest': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'followup': result.sort((a, b) => {
        if (!a.followUp && !b.followUp) return 0;
        if (!a.followUp) return 1;
        if (!b.followUp) return -1;
        return new Date(a.followUp).getTime() - new Date(b.followUp).getTime();
      }); break;
    }
    return result;
  }, [leads, search, filterStage, filterCategory, filterZip, filterTier, sortBy]);

  const availableZips = useMemo(() => {
    const zips = new Set(leads.map((l) => l.zip));
    return ZIP_TIERS.filter((z) => zips.has(z.zip));
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#B8985A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">All Leads</h1>
        <span className="text-sm bg-[#B8985A]/20 text-[#B8985A] font-bold px-3 py-1 rounded-full">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search by address or details..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#B8985A] focus:border-[#B8985A] outline-none" />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-[#B8985A] outline-none">
          <option value="all">All Stages</option>
          {STAGES.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-[#B8985A] outline-none">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.icon} {c.label}</option>))}
        </select>
        <select value={filterZip} onChange={(e) => setFilterZip(e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-[#B8985A] outline-none">
          <option value="all">All Zips</option>
          {availableZips.map((z) => (<option key={z.zip} value={z.zip}>{z.zip} - {z.area}</option>))}
        </select>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-[#B8985A] outline-none">
          <option value="all">All Score Tiers</option>
          <option value="hot">Hot (75+)</option>
          <option value="warm">Warm (50-74)</option>
          <option value="cool">Cool (25-49)</option>
          <option value="cold">Cold (0-24)</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-[#B8985A] outline-none">
          <option value="score">Sort: Score (High to Low)</option>
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="followup">Sort: Follow-up Date</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No leads match your filters</p>
          <button onClick={() => { setSearch(''); setFilterStage('all'); setFilterCategory('all'); setFilterZip('all'); setFilterTier('all'); }} className="mt-2 text-sm text-[#B8985A] hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((lead) => (<LeadCard key={lead.id} lead={lead} />))}
        </div>
      )}
    </div>
  );
}
