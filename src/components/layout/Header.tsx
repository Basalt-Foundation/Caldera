'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NetworkBadge } from '@/components/layout/NetworkBadge';
import { WalletButton } from '@/components/wallet/WalletButton';

const NAV_LINKS = [
  { href: '/swap', label: 'Swap' },
  { href: '/pools', label: 'Pools' },
  { href: '/liquidity', label: 'Liquidity' },
  { href: '/orders', label: 'Orders' },
  { href: '/portfolio', label: 'Portfolio' },
] as const;

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-accent tracking-tight">
                Caldera
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname === href
                      ? 'text-accent bg-accent-muted'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Network + Wallet */}
          <div className="flex items-center gap-3">
            <NetworkBadge />
            <WalletButton />

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border px-4 pb-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === href
                  ? 'text-accent bg-accent-muted'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
