'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatTokenAmount } from '@/lib/format/amounts';
import { descalePrice } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DexOrderResponse } from '@/lib/types/api';

interface OrderBookVizProps {
  orders: DexOrderResponse[];
  isLoading: boolean;
  className?: string;
}

/**
 * Simple order book depth visualization.
 * Buy orders (green) on the left, sell orders (red) on the right.
 * Horizontal bar chart style showing price and amount for each level.
 */
export function OrderBookViz({ orders, isLoading, className }: OrderBookVizProps) {
  const { buyOrders, sellOrders, maxAmount } = useMemo(() => {
    const buys = orders
      .filter((o) => o.isBuy)
      .sort((a, b) => {
        const aPrice = BigInt(a.price);
        const bPrice = BigInt(b.price);
        return bPrice > aPrice ? 1 : bPrice < aPrice ? -1 : 0;
      });

    const sells = orders
      .filter((o) => !o.isBuy)
      .sort((a, b) => {
        const aPrice = BigInt(a.price);
        const bPrice = BigInt(b.price);
        return aPrice > bPrice ? 1 : aPrice < bPrice ? -1 : 0;
      });

    let max = 0n;
    for (const o of [...buys, ...sells]) {
      const amt = BigInt(o.amount);
      if (amt > max) max = amt;
    }

    return { buyOrders: buys.slice(0, 10), sellOrders: sells.slice(0, 10), maxAmount: max };
  }, [orders]);

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Order Book</h3>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 rounded bg-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (buyOrders.length === 0 && sellOrders.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Order Book</h3>
        <p className="text-sm text-text-tertiary text-center py-8">No active orders</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Order Book</h3>

      {/* Column headers */}
      <div className="flex items-center justify-between text-xs text-text-tertiary uppercase tracking-wider mb-2 px-1">
        <span>Price</span>
        <span>Amount</span>
      </div>

      {/* Sell orders (red, top) */}
      <div className="space-y-0.5 mb-2">
        {sellOrders.map((order, i) => {
          const amt = BigInt(order.amount);
          const pct = maxAmount > 0n ? Number((amt * 100n) / maxAmount) : 0;

          return (
            <motion.div
              key={order.orderId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative flex items-center justify-between py-1 px-1 rounded text-xs"
            >
              <div
                className="absolute inset-y-0 right-0 rounded bg-sell/10"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
              <span className="relative font-mono text-sell tabular-nums">
                {formatTokenAmount(descalePrice(order.price), 18, 6)}
              </span>
              <span className="relative font-mono text-text-secondary tabular-nums">
                {formatTokenAmount(order.amount, 18, 4)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Spread line */}
      {buyOrders.length > 0 && sellOrders.length > 0 && (
        <div className="border-t border-border my-2" />
      )}

      {/* Buy orders (green, bottom) */}
      <div className="space-y-0.5">
        {buyOrders.map((order, i) => {
          const amt = BigInt(order.amount);
          const pct = maxAmount > 0n ? Number((amt * 100n) / maxAmount) : 0;

          return (
            <motion.div
              key={order.orderId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative flex items-center justify-between py-1 px-1 rounded text-xs"
            >
              <div
                className="absolute inset-y-0 left-0 rounded bg-buy/10"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
              <span className="relative font-mono text-buy tabular-nums">
                {formatTokenAmount(descalePrice(order.price), 18, 6)}
              </span>
              <span className="relative font-mono text-text-secondary tabular-nums">
                {formatTokenAmount(order.amount, 18, 4)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
