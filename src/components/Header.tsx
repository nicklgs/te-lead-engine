'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/scrub', label: 'Scrub' },
  { href: '/buyers', label: 'Buyers' },
  { href: '/add', label: 'Add Lead' },
  { href: '/settings', label: 'Settings' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header style={{ height: 56, background: 'var(--navy-deep)', borderBottom: '1px solid var(--navy-mid)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 0, flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginRight: 32 }}>
        <div style={{ width: 34, height: 34, border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, letterSpacing: '0.05em', flexShrink: 0 }}>
          TE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>TE Home Buyers</span>
          <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Lead Engine</span>
        </div>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 14px',
                color: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.55)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                borderRadius: 4,
                background: isActive ? 'rgba(184,152,90,0.1)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'livepulse 2s infinite' }} />
          Live
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--navy-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
          TM
        </div>
      </div>

      <style>{`
        @keyframes livepulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </header>
  );
}
