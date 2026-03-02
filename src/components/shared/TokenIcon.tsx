'use client';

import { cn } from '@/lib/utils';
import { getTokenLabel } from '@/lib/constants';

interface TokenIconProps {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Override the badge label (e.g. from a parent-resolved symbol). */
  symbol?: string;
}

const dimMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const textMap = {
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-xs',
};

const textMapLong = {
  sm: 'text-[6px]',
  md: 'text-[8px]',
  lg: 'text-[10px]',
};

function addressToHue(addr: string): number {
  let hash = 0;
  for (let i = 0; i < addr.length; i++) {
    hash = (hash * 31 + addr.charCodeAt(i)) & 0xffff;
  }
  return hash % 360;
}

export function TokenIcon({ address, size = 'md', className, symbol }: TokenIconProps) {
  const hue = addressToHue(address);
  const label = symbol ?? getTokenLabel(address);
  const longLabel = label.length > 2;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-mono font-bold text-white shrink-0',
        dimMap[size],
        longLabel ? textMapLong[size] : textMap[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 60%, 40%), hsl(${(hue + 40) % 360}, 60%, 30%))`,
      }}
      title={address}
    >
      {label}
    </div>
  );
}
