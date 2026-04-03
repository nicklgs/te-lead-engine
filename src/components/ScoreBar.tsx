'use client';

import type { ScoreTier } from '@/lib/types';

const TIER_CONFIG: Record<ScoreTier, { label: string; color: string; bg: string }> = {
  hot: { label: 'HOT', color: '#8B1A1A', bg: 'bg-red-100' },
  warm: { label: 'WARM', color: '#B8985A', bg: 'bg-amber-100' },
  cool: { label: 'COOL', color: '#3b82f6', bg: 'bg-blue-100' },
  cold: { label: 'COLD', color: '#6b7280', bg: 'bg-gray-100' },
};

export default function ScoreBar({ score, tier, size = 'md' }: { score: number; tier: ScoreTier; size?: 'sm' | 'md' | 'lg' }) {
  const config = TIER_CONFIG[tier];
  const barWidth = `${Math.max(score, 5)}%`;

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: barWidth, backgroundColor: config.color }}
        />
      </div>
      <div className="flex items-center gap-1.5 min-w-[70px]">
        <span className="text-xs font-bold" style={{ color: config.color }}>{score}</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.bg}`}
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
