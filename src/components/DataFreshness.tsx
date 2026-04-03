'use client';

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export default function DataFreshness({ date, label }: { date: Date; label: string }) {
  const days = daysSince(date);
  let color = '#2D7A4F';
  let text = 'Fresh';
  if (days > 30) { color = '#8B1A1A'; text = 'Stale'; }
  else if (days > 14) { color = '#B8985A'; text = 'Aging'; }
  else if (days > 7) { color = '#f59e0b'; text = 'Recent'; }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-gray-500">{label}:</span>
      <span style={{ color }} className="font-medium">
        {text} ({days === 0 ? 'today' : `${days}d ago`})
      </span>
    </div>
  );
}
