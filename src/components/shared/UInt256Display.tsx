'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface UInt256DisplayProps {
  /** Raw value as string or bigint. */
  value: string | bigint;
  /** Token decimals (default 18). */
  decimals?: number;
  /** Number of decimals to display (default 6). */
  displayDecimals?: number;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Format and display a UInt256 value with thousands separators.
 * Shows full precision in a tooltip on hover.
 */
export function UInt256Display({
  value,
  decimals = 18,
  displayDecimals = 6,
  className,
}: UInt256DisplayProps) {
  const [showFull, setShowFull] = useState(false);

  const raw = typeof value === 'string' ? BigInt(value || '0') : value;
  const formatted = formatWithSeparators(raw, decimals, displayDecimals);
  const full = formatWithSeparators(raw, decimals, decimals);

  return (
    <span
      className={cn('font-mono tabular-nums relative cursor-default', className)}
      onMouseEnter={() => setShowFull(true)}
      onMouseLeave={() => setShowFull(false)}
    >
      {formatted}
      {showFull && full !== formatted && (
        <span className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary shadow-lg">
          {full}
        </span>
      )}
    </span>
  );
}

function formatWithSeparators(
  raw: bigint,
  decimals: number,
  displayDecimals: number,
): string {
  const isNegative = raw < 0n;
  const abs = isNegative ? -raw : raw;

  const divisor = 10n ** BigInt(decimals);
  const integerPart = abs / divisor;
  const fractionalPart = abs % divisor;

  const fracStr = fractionalPart
    .toString()
    .padStart(decimals, '0')
    .slice(0, displayDecimals);

  const trimmedFrac = fracStr.replace(/0+$/, '');
  const intStr = integerPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const sign = isNegative ? '-' : '';
  return trimmedFrac.length > 0
    ? `${sign}${intStr}.${trimmedFrac}`
    : `${sign}${intStr}`;
}
