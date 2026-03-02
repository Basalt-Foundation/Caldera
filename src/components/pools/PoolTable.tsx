'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PoolRow } from '@/components/pools/PoolRow';
import { useTokenSymbols } from '@/hooks/useTokenSymbols';
import { cn } from '@/lib/utils';
import type { DexPoolResponse } from '@/lib/types/api';

type SortKey = 'pair' | 'feeBps' | 'reserve0' | 'reserve1' | 'totalSupply';
type SortDir = 'asc' | 'desc';

interface PoolTableProps {
  pools: DexPoolResponse[];
  isLoading: boolean;
}

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'pair', label: 'Pool', align: 'left' },
  { key: 'feeBps', label: 'Fee Tier', align: 'left' },
  { key: 'reserve0', label: 'Reserve 0', align: 'right' },
  { key: 'reserve1', label: 'Reserve 1', align: 'right' },
  { key: 'totalSupply', label: 'Total Supply', align: 'right' },
];

/**
 * Sortable table of DEX pools.
 * Clicking column headers toggles sort direction.
 */
export function PoolTable({ pools, isLoading }: PoolTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('reserve0');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Collect all unique token addresses and resolve symbols in one batch
  const allTokenAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const p of pools) {
      set.add(p.token0);
      set.add(p.token1);
    }
    return Array.from(set);
  }, [pools]);
  const { getSymbol } = useTokenSymbols(allTokenAddresses);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    const copy = [...pools];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'pair':
          cmp = `${a.token0}/${a.token1}`.localeCompare(`${b.token0}/${b.token1}`);
          break;
        case 'feeBps':
          cmp = a.feeBps - b.feeBps;
          break;
        case 'reserve0': {
          const aVal = BigInt(a.reserve0);
          const bVal = BigInt(b.reserve0);
          cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          break;
        }
        case 'reserve1': {
          const aVal = BigInt(a.reserve1);
          const bVal = BigInt(b.reserve1);
          cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          break;
        }
        case 'totalSupply': {
          const aVal = BigInt(a.totalSupply);
          const bVal = BigInt(b.totalSupply);
          cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [pools, sortKey, sortDir]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (pools.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-tertiary text-sm">No pools found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider cursor-pointer select-none hover:text-text-secondary transition-colors',
                  col.align === 'right' ? 'text-right' : 'text-left',
                )}
                onClick={() => handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key && (
                    sortDir === 'asc'
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((pool) => (
            <PoolRow key={pool.poolId} pool={pool} getSymbol={getSymbol} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-20 rounded bg-border animate-pulse" />
          ))}
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b border-border/50 px-4 py-3.5">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-1">
              <div className="w-6 h-6 rounded-full bg-border animate-pulse" />
              <div className="w-6 h-6 rounded-full bg-border animate-pulse" />
            </div>
            <div className="h-4 w-32 rounded bg-border animate-pulse" />
            <div className="h-4 w-16 rounded bg-border animate-pulse" />
            <div className="flex-1" />
            <div className="h-4 w-24 rounded bg-border animate-pulse" />
            <div className="h-4 w-24 rounded bg-border animate-pulse" />
            <div className="h-4 w-24 rounded bg-border animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
