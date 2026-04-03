'use client';

import type { Lead, LeadStage } from '@/lib/types';
import { STAGE_MAP } from '@/lib/constants';
import { scoreLead } from '@/lib/scoring';
import LeadCard from './LeadCard';

const STAGE_BORDER_COLORS: Partial<Record<LeadStage, string>> = {
  new:       '#6366f1',
  contacted: '#2563EB',
  appt:      '#C07028',
  offer:     '#B8985A',
  contract:  '#1A8C52',
  closed:    '#2D7A4F',
  dead:      '#8A98AE',
};

interface PipelineStageProps {
  stageId: LeadStage;
  leads: Lead[];
}

export default function PipelineStage({ stageId, leads }: PipelineStageProps) {
  const stage = STAGE_MAP[stageId];
  const borderColor = STAGE_BORDER_COLORS[stageId] ?? '#8A98AE';
  const sorted = [...leads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div style={{ width: 230, minWidth: 230, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Column header */}
      <div style={{
        padding: '10px 12px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `2px solid ${borderColor}`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--navy)' }}>
          {stage?.label || stageId}
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1 }}>
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 7, minHeight: 80 }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, border: '1px dashed var(--border)', borderRadius: 6, background: 'var(--cream)' }}>
            No leads
          </div>
        ) : (
          sorted.map((lead) => {
            const { breakdown } = scoreLead(lead);
            return <LeadCard key={lead.id} lead={lead} breakdown={breakdown} />;
          })
        )}
      </div>
    </div>
  );
}
