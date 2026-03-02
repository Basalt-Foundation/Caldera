'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import type { DexPoolResponse } from '@/lib/types/api';
import { truncateAddress } from '@/lib/format/addresses';
import { formatTokenAmount } from '@/lib/format/amounts';
import { TokenIcon } from '@/components/shared/TokenIcon';

interface TvlChartProps {
  pools: DexPoolResponse[];
}

export function TvlChart({ pools }: TvlChartProps) {
  // Sort pools by combined reserves (proxy for TVL) descending
  const sorted = [...pools]
    .map((pool) => ({
      ...pool,
      totalReserves: BigInt(pool.reserve0) + BigInt(pool.reserve1),
    }))
    .sort((a, b) => (b.totalReserves > a.totalReserves ? 1 : -1))
    .slice(0, 10);

  const maxReserve =
    sorted.length > 0 ? sorted[0].totalReserves : BigInt(1);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Total Value Locked (by reserves)
        </h3>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-text-secondary">No pool data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((pool, index) => {
            const pct =
              maxReserve > BigInt(0)
                ? Number((pool.totalReserves * BigInt(100)) / maxReserve)
                : 0;

            return (
              <motion.div
                key={pool.poolId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <TokenIcon address={pool.token0} size="sm" />
                      <TokenIcon address={pool.token1} size="sm" />
                    </div>
                    <span className="text-sm text-text-primary">
                      {truncateAddress(pool.token0, 6, 4)} /{' '}
                      {truncateAddress(pool.token1, 6, 4)}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-text-secondary">
                    {formatTokenAmount(pool.totalReserves.toString())}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-background overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, hsl(33, 95%, 50%), hsl(20, 90%, 40%))',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.max(pct, 2)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.06 + 0.2 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
