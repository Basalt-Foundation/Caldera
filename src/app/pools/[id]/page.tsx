'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePool } from '@/hooks/usePool';
import { useOrders } from '@/hooks/useOrders';
import { useTwap } from '@/hooks/useTwap';
import { PriceChart } from '@/components/pool-detail/PriceChart';
import { ReservesPanel } from '@/components/pool-detail/ReservesPanel';
import { OrderBookViz } from '@/components/pool-detail/OrderBookViz';
import { PoolStats } from '@/components/pool-detail/PoolStats';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { truncateAddress } from '@/lib/format/addresses';
import { useTokenSymbols } from '@/hooks/useTokenSymbols';

interface PoolDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Pool detail page showing price chart, reserves, order book, and stats.
 */
export default function PoolDetailPage({ params }: PoolDetailPageProps) {
  const { id } = use(params);
  const poolId = parseInt(id, 10);
  const { pool, isLoading: poolLoading } = usePool(isNaN(poolId) ? undefined : poolId);
  const { orders, isLoading: ordersLoading } = useOrders(isNaN(poolId) ? undefined : poolId);
  const { twap } = useTwap(isNaN(poolId) ? undefined : poolId);
  const tokenAddrs = pool ? [pool.token0, pool.token1] : [];
  const { getSymbol } = useTokenSymbols(tokenAddrs);

  if (poolLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <PoolDetailSkeleton />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Pool Not Found</h2>
          <p className="text-sm text-text-secondary mb-6">
            Pool #{id} does not exist or could not be loaded.
          </p>
          <Link
            href="/pools"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/pools"
            className="p-2 rounded-lg border border-border hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <TokenIcon address={pool.token0} size="lg" symbol={getSymbol(pool.token0)} />
              <TokenIcon address={pool.token1} size="lg" symbol={getSymbol(pool.token1)} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {getSymbol(pool.token0)} / {getSymbol(pool.token1)}
              </h1>
              <p className="text-xs text-text-secondary font-mono">
                {truncateAddress(pool.token0)} / {truncateAddress(pool.token1)}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center rounded-md bg-accent/10 px-2.5 py-1 text-xs font-mono text-accent">
            {(pool.feeBps / 100).toFixed(2)}% fee
          </span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Price chart - full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-2">
            <PriceChart
              spotPrice={twap?.spotPrice ?? null}
              poolId={pool.poolId}
            />
          </div>

          {/* Stats panel */}
          <PoolStats
            poolId={pool.poolId}
            feeBps={pool.feeBps}
            twap={twap}
            totalSupply={pool.totalSupply}
          />

          {/* Reserves */}
          <ReservesPanel
            token0={pool.token0}
            token1={pool.token1}
            reserve0={pool.reserve0}
            reserve1={pool.reserve1}
          />

          {/* Order Book */}
          <div className="lg:col-span-2">
            <OrderBookViz
              orders={orders}
              isLoading={ordersLoading}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PoolDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-border animate-pulse" />
        <div className="flex -space-x-2">
          <div className="w-10 h-10 rounded-full bg-border animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-border animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <div className="h-5 w-32 rounded bg-border animate-pulse" />
          <div className="h-3 w-48 rounded bg-border animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[300px] rounded-xl bg-border animate-pulse" />
        <div className="h-[300px] rounded-xl bg-border animate-pulse" />
        <div className="h-40 rounded-xl bg-border animate-pulse" />
        <div className="lg:col-span-2 h-60 rounded-xl bg-border animate-pulse" />
      </div>
    </div>
  );
}
