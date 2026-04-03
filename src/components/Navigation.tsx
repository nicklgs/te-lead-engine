'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', emoji: '\uD83C\uDFE0' },
  { href: '/leads', label: 'Leads', emoji: '\uD83D\uDCCB' },
  { href: '/scrub', label: 'Scrub', emoji: '\uD83D\uDD0D' },
  { href: '/add', label: 'Add', emoji: '\u2795' },
  { href: '/buyers', label: 'Buyers', emoji: '\uD83E\uDD1D' },
  { href: '/settings', label: 'More', emoji: '\u2699\uFE0F' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex justify-around items-center py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 min-w-[48px] ${
                isActive ? 'text-[#B8985A]' : 'text-gray-400'
              }`}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
