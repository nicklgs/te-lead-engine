'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Lead, LeadStage, CategoryId } from '@/lib/types';
import { STAGES, CATEGORIES, ZIP_TIERS } from '@/lib/constants';
import { scoreLead } from '@/lib/scoring';
import { DEMO_LEADS } from '@/lib/demo-data';
import PipelineStage from '@/components/PipelineStage';

function applyScores(leads: Lead[]): Lead[] {
  return leads.map((lead) => {
    const { score, tier } = scoreLead(lead);
    return { ...lead, score, scoreTier: tier };
  });
}

function isOverdue(lead: Lead): boolean {
  if (!lead.followUp) return false;
  return new Date(lead.followUp).getTime() < Date.now();
}

const FILTER_PILLS = [
  { id: 'all',   label: 'All' },
  { id: 'hot',   label: 'Hot' },
  { id: 'warm',  label: 'Warm' },
  { id: 'tx',    label: 'Tax Delinquent' },
  { id: 'fc',    label: 'Pre-Foreclosure' },
  { id: 'pb',    label: 'Probate' },
];

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    async function loadLeads() {
      try {
        const { getLeads } = await import('@/lib/firebase');
        const fbLeads = await getLeads();
        setLeads(applyScores(fbLeads.length > 0 ? fbLeads : DEMO_LEADS));
      } catch {
        setLeads(applyScores(DEMO_LEADS));
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return leads;
    if (activeFilter === 'hot') return leads.filter((l) => l.scoreTier === 'hot');
    if (activeFilter === 'warm') return leads.filter((l) => l.scoreTier === 'warm');
    const tier = ['1','2','3'].includes(activeFilter) ? Number(activeFilter) : null;
    if (tier !== null) {
      const tierZips = ZIP_TIERS.filter((z) => z.tier === tier).map((z) => z.zip);
      return leads.filter((l) => tierZips.includes(l.zip));
    }
    return leads.filter((l) => l.stackedCategories.includes(activeFilter as CategoryId));
  }, [leads, activeFilter]);

  const overdueLeads = filtered.filter(isOverdue);
  const hotLeads = filtered.filter((l) => l.scoreTier === 'hot');
  const pipelineValue = filtered.reduce((sum, l) => sum + (l.offer?.maxOffer ?? 0), 0);
  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((sum, l) => sum + (l.score ?? 0), 0) / filtered.length)
    : 0;

  const stageGroups = useMemo(() => {
    const groups: Record<LeadStage, Lead[]> = {
      new: [], contacted: [], appt: [], offer: [], contract: [], closed: [], dead: [],
    };
    for (const lead of filtered) {
      if (groups[lead.stage]) groups[lead.stage].push(lead);
    }
    return groups;
  }, [filtered]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading pipeline…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Overdue alert */}
      {overdueLeads.length > 0 && !alertDismissed && (
        <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red-bright)', flexShrink: 0, animation: 'livepulse 1.5s infinite' }} />
          <span style={{ flex: 1, fontSize: 12, color: 'var(--red-bright)', fontWeight: 500 }}>
            <strong>{overdueLeads.length} follow-up{overdueLeads.length > 1 ? 's' : ''} overdue</strong>
            {' — '}
            {overdueLeads.slice(0, 2).map((l) => l.title.split(',')[0]).join(', ')}
          </span>
          <Link href="/leads?sort=followup" style={{ fontSize: 11, color: 'var(--red-bright)', fontWeight: 600, textDecoration: 'underline' }}>View All</Link>
          <button onClick={() => setAlertDismissed(true)} style={{ background: 'none', border: 'none', color: '#F87171', fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1, opacity: 0.7 }}>×</button>
        </div>
      )}

      {/* Page header */}
      <div style={{ padding: '18px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600, color: 'var(--navy)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Pipeline Overview
          </h1>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
          {[
            { label: 'Total Leads',    value: filtered.length,                         sub: `${leads.length} total`,      accent: 'var(--navy)',       accentBg: 'var(--navy)' },
            { label: 'Hot Leads',      value: hotLeads.length,                          sub: 'Score 75+',                  accent: 'var(--red-bright)', accentBg: 'var(--red-bright)' },
            { label: 'Pipeline Value', value: `$${Math.round(pipelineValue / 1000)}K`, sub: 'Est. MAO total',             accent: 'var(--gold)',       accentBg: 'var(--gold)' },
            { label: 'Avg Score',      value: avgScore,                                 sub: 'Across pipeline',            accent: 'var(--blue)',       accentBg: 'var(--blue)' },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, background: 'var(--cream)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.accentBg }} />
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: stat.accent }}>{stat.value}</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{stat.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginTop: 1 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px 10px', flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>Filter</span>
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setActiveFilter(pill.id)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: `1px solid ${activeFilter === pill.id ? 'var(--navy)' : 'var(--border)'}`,
              fontSize: 11,
              fontWeight: 500,
              color: activeFilter === pill.id ? 'white' : 'var(--text-mid)',
              background: activeFilter === pill.id ? 'var(--navy)' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-body)',
            }}
          >
            {pill.label}
          </button>
        ))}
        <Link
          href="/add"
          style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 4, background: 'var(--navy)', color: 'white', fontSize: 11, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.15s' }}
        >
          + Add Lead
        </Link>
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, display: 'flex', gap: 10, padding: '0 24px 16px', overflowX: 'auto', overflowY: 'hidden', alignItems: 'flex-start' }}>
        {STAGES.filter((s) => s.id !== 'dead').map((stage) => (
          <PipelineStage
            key={stage.id}
            stageId={stage.id}
            leads={stageGroups[stage.id] || []}
          />
        ))}
      </div>

      <style>{`
        @keyframes livepulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
