'use client';

import { motion } from 'framer-motion';
import { Layers, Droplets } from 'lucide-react';
import type { DexPoolResponse } from '@/lib/types/api';
import { formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { TokenIcon } from '@/components/shared/TokenIcon';

interface LpPositionsListProps {
  pools: DexPoolResponse[];
}

export function LpPositionsList({ pools }: LpPositionsListProps) {
  // Placeholder: In production, we would query LP token balances for the user.
  // For now, show an informational state with available pools.
  const hasPositions = false;

  if (!hasPositions) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            LP Positions
          </h3>
        </div>

        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-hover mb-4">
            <Droplets className="w-7 h-7 text-text-tertiary" />
          </div>
          <p className="text-text-secondary font-medium mb-1">
            No liquidity positions
          </p>
          <p className="text-sm text-text-tertiary max-w-xs">
            Add liquidity to a pool to earn trading fees. Your LP positions will
            appear here.
          </p>
          {pools.length > 0 && (
            <a
              href="/liquidity"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Add Liquidity
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Show available pools as a hint */}
        {pools.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-text-tertiary mb-3">
              Available pools ({pools.length})
            </p>
            <div className="space-y-2">
              {pools.slice(0, 3).map((pool) => (
                <div
                  key={pool.poolId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <TokenIcon address={pool.token0} size="sm" />
                      <TokenIcon address={pool.token1} size="sm" />
                    </div>
                    <span className="text-sm text-text-secondary">
                      {truncateAddress(pool.token0, 6, 4)} /{' '}
                      {truncateAddress(pool.token1, 6, 4)}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-text-tertiary">
                    {pool.feeBps / 100}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}
