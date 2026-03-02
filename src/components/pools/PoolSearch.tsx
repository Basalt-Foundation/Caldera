'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PoolSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Search/filter input for the pool list.
 * Filters by token address substring.
 */
export function PoolSearch({ value, onChange, className }: PoolSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
      <input
        type="text"
        placeholder="Search by token address..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/50 transition-colors"
      />
    </div>
  );
}
