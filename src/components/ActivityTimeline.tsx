'use client';

import type { Activity } from '@/lib/types';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  note: { icon: '\u270F', color: '#6b7280' },
  stage: { icon: '\u2192', color: '#3b82f6' },
  skip_trace: { icon: '\uD83D\uDD0D', color: '#8b5cf6' },
  comps: { icon: '\uD83C\uDFE0', color: '#10b981' },
  offer: { icon: '\uD83D\uDCB0', color: '#B8985A' },
  followup: { icon: '\uD83D\uDCC5', color: '#f59e0b' },
  call: { icon: '\uD83D\uDCDE', color: '#2D7A4F' },
  text: { icon: '\uD83D\uDCF1', color: '#06b6d4' },
};

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-6">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((activity, idx) => {
        const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.note;
        const isLast = idx === sorted.length - 1;
        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ backgroundColor: config.color + '20', color: config.color }}
              >
                {config.icon}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />
              )}
            </div>
            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <p className="text-sm text-[#1B2A4A] leading-snug">{activity.text}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(activity.date).toLocaleDateString()} at{' '}
                {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
