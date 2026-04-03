'use client';

import { useRouter } from 'next/navigation';
import type { Lead } from '@/lib/types';
import { CATEGORY_MAP } from '@/lib/constants';
import type { ScoreBreakdown } from '@/lib/scoring';

const TIER_COLORS: Record<string, string> = {
  hot: '#C0392B',
  warm: '#C07028',
  cool: '#2563EB',
  cold: '#8A98AE',
};

function getDaysSince(date: Date | string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function getDecayInfo(days: number): { cls: string; badge: string; label: string } {
  if (days < 4)  return { cls: '',            badge: '',      label: '' };
  if (days < 8)  return { cls: 'decay-aging', badge: 'aging', label: `${days}d idle` };
  if (days < 15) return { cls: 'decay-stale', badge: 'stale', label: `${days}d stale` };
  if (days < 22) return { cls: 'decay-cold',  badge: 'cold',  label: `${days}d cold` };
  return           { cls: 'decay-dead',  badge: 'dead',  label: `${days}d dead` };
}

const DECAY_BADGE_STYLE: Record<string, React.CSSProperties> = {
  aging: { color: '#92400E', background: '#FEF3C7' },
  stale: { color: '#78350F', background: '#FDE68A' },
  cold:  { color: '#7C2D12', background: '#FED7AA' },
  dead:  { color: '#C0392B', background: '#FEE2E2' },
};

function ScoreTooltip({ score, breakdown }: { score: number; breakdown?: ScoreBreakdown }) {
  if (!breakdown) return null;
  const rows = [
    { cat: 'Distress Signal',   pts: breakdown.distress,  max: 40 },
    { cat: 'Property Factors',  pts: breakdown.property,  max: 25 },
    { cat: 'Equity Position',   pts: breakdown.equity,    max: 20 },
    { cat: 'Data Quality',      pts: breakdown.quality,   max: 15 },
    { cat: 'Stacking Bonus',    pts: breakdown.stacking,  max: 15 },
  ];
  return (
    <div className="score-tooltip">
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 7, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        Score Breakdown
      </div>
      {rows.map((r) => (
        <div key={r.cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', fontSize: 10, color: 'rgba(255,255,255,0.6)', gap: 10 }}>
          <span style={{ flex: 1 }}>{r.cat}</span>
          <span style={{ fontWeight: 700, color: r.pts === 0 ? 'rgba(255,255,255,0.2)' : 'var(--gold-light)', fontSize: 11 }}>
            +{r.pts}<span style={{ opacity: 0.25, fontWeight: 400, fontSize: 8 }}> /{r.max}</span>
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 12, fontWeight: 700, color: 'white' }}>
        <span>Total Score</span>
        <span>{score} / 100</span>
      </div>
    </div>
  );
}

export default function LeadCard({ lead, breakdown }: { lead: Lead; breakdown?: ScoreBreakdown }) {
  const router = useRouter();
  const score = lead.score ?? 0;
  const tier = lead.scoreTier ?? 'cold';
  const tierColor = TIER_COLORS[tier] ?? '#8A98AE';
  const isOverdue = lead.followUp ? new Date(lead.followUp).getTime() < Date.now() : false;

  const daysSince = getDaysSince(lead.updatedAt || lead.createdAt);
  const decay = getDecayInfo(daysSince);

  const metaText = lead.followUp
    ? isOverdue
      ? '↑ Overdue'
      : new Date(lead.followUp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : lead.location;

  const handleCardClick = () => router.push(`/lead/${lead.id}`);

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    router.push(`/lead/${lead.id}?tab=crm&action=${action}`);
  };

  return (
    <div
      className={`lead-card-wrap ${decay.cls}`}
      style={{
        position: 'relative',
        background: 'white',
        border: `1px solid var(--border-light)`,
        borderRadius: 6,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.15s',
      }}
      onClick={handleCardClick}
    >
      {/* Tier left border */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', borderRadius: '6px 0 0 6px', background: tierColor }} />

      {/* Decay bottom bar */}
      {decay.cls && <div className="decay-bar" />}

      <div style={{ padding: '11px 13px 11px 16px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.25, flex: 1 }}>
            {lead.title.split(',')[0]}
          </div>
          <div className="score-wrap" style={{ position: 'relative', cursor: 'help', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, lineHeight: 1, color: tierColor }}>{score}</span>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1, color: tierColor }}>{tier.toUpperCase()}</span>
            </div>
            <ScoreTooltip score={score} breakdown={breakdown} />
          </div>
        </div>

        {/* Category tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
          {lead.stackedCategories.map((catId) => {
            const cat = CATEGORY_MAP[catId];
            return (
              <span key={catId} style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 3, border: '1px solid var(--border)', color: 'var(--text-mid)', background: 'var(--sand)', whiteSpace: 'nowrap' }}>
                {cat?.icon} {cat?.label || catId}
              </span>
            );
          })}
          {lead.stackCount > 1 && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 3, background: 'var(--navy)', color: 'white', border: '1px solid var(--navy)' }}>
              ×{lead.stackCount}
            </span>
          )}
        </div>

        {/* Score bar */}
        <div style={{ height: 3, background: 'var(--sand-mid)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: tierColor, width: `${score}%`, transition: 'width 0.6s ease' }} />
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 10, color: isOverdue ? 'var(--red-bright)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
            {metaText}
          </span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {isOverdue && (
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red-bright)', background: '#FEE2E2', padding: '2px 6px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Overdue
              </span>
            )}
            {decay.badge && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.05em', textTransform: 'uppercase', ...DECAY_BADGE_STYLE[decay.badge] }}>
                {decay.label}
              </span>
            )}
            <span style={{ width: 20, height: 20, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, background: lead.skipTrace ? '#DCFCE7' : 'var(--sand)', color: lead.skipTrace ? '#166534' : 'var(--text-muted)' }} title="Skip Trace">ST</span>
            <span style={{ width: 20, height: 20, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, background: lead.comps ? '#DCFCE7' : 'var(--sand)', color: lead.comps ? '#166534' : 'var(--text-muted)' }} title="Comps">CP</span>
            <span style={{ width: 20, height: 20, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, background: lead.offer ? '#DCFCE7' : 'var(--sand)', color: lead.offer ? '#166534' : 'var(--text-muted)' }} title="Offer">OF</span>
          </div>
        </div>
      </div>

      {/* Quick-action hover buttons */}
      <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
        {[
          { icon: '📞', label: 'Log Call',    action: 'call' },
          { icon: '⏰', label: 'Follow-up',   action: 'followup' },
          { icon: '→', label: 'Move Stage',   action: 'stage' },
        ].map(({ icon, label, action }) => (
          <button
            key={action}
            onClick={(e) => handleQuickAction(e, action)}
            style={{
              flex: 1, padding: '6px 2px 7px', fontSize: 9, fontWeight: 600,
              color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, letterSpacing: '0.03em',
              fontFamily: 'var(--font-body)', transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
