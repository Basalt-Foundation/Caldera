'use client';

import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { DexPoolResponse } from '@/lib/types/api';
import { formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { TokenIcon } from '@/components/shared/TokenIcon';

interface TopPoolsTableProps {
  pools: DexPoolResponse[];
}

export function TopPoolsTable({ pools }: TopPoolsTableProps) {
  const sorted = [...pools]
    .map((pool) => ({
      ...pool,
      totalReserves: BigInt(pool.reserve0) + BigInt(pool.reserve1),
    }))
    .sort((a, b) => (b.totalReserves > a.totalReserves ? 1 : -1))
    .slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between p-5 pb-0 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Top Pools
          </h3>
        </div>
        <Link
          href="/pools"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-5 pb-5">
          <p className="text-text-secondary">No pools available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider w-10">
                  #
                </th>
                <th className="text-left px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Pool
                </th>
                <th className="text-right px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Fee
                </th>
                <th className="text-right px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider hidden sm:table-cell">
                  Reserve 0
                </th>
                <th className="text-right px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider hidden sm:table-cell">
                  Reserve 1
                </th>
                <th className="text-right px-5 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Total Supply
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((pool, index) => (
                <motion.tr
                  key={pool.poolId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <span
                      className={`font-mono text-xs font-bold ${
                        index < 3 ? 'text-accent' : 'text-text-tertiary'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/pools/${pool.poolId}`}
                      className="flex items-center gap-2 hover:text-accent transition-colors"
                    >
                      <div className="flex -space-x-1">
                        <TokenIcon address={pool.token0} size="sm" />
                        <TokenIcon address={pool.token1} size="sm" />
                      </div>
                      <div>
                        <span className="text-text-primary font-medium">
                          {truncateAddress(pool.token0, 6, 4)}
                        </span>
                        <span className="text-text-tertiary mx-1">/</span>
                        <span className="text-text-primary font-medium">
                          {truncateAddress(pool.token1, 6, 4)}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-accent/10 text-accent">
                      {pool.feeBps / 100}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right hidden sm:table-cell">
                    <span className="font-mono text-text-secondary">
                      {formatTokenAmount(pool.reserve0)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right hidden sm:table-cell">
                    <span className="font-mono text-text-secondary">
                      {formatTokenAmount(pool.reserve1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-mono text-text-secondary">
                      {formatTokenAmount(pool.totalSupply)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
