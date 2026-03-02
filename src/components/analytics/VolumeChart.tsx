'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Layers, Activity } from 'lucide-react';
import type { DexPoolResponse } from '@/lib/types/api';
import { formatTokenAmount } from '@/lib/format/amounts';

interface VolumeChartProps {
  pools: DexPoolResponse[];
  blockHeight: number;
}

export function VolumeChart({ pools, blockHeight }: VolumeChartProps) {
  const totalReserves = pools.reduce(
    (sum, pool) => sum + BigInt(pool.reserve0) + BigInt(pool.reserve1),
    BigInt(0),
  );

  const totalSupply = pools.reduce(
    (sum, pool) => sum + BigInt(pool.totalSupply),
    BigInt(0),
  );

  const stats = [
    {
      label: 'Total Pools',
      value: pools.length.toString(),
      icon: Layers,
      color: 'text-accent',
    },
    {
      label: 'Total Reserves',
      value: formatTokenAmount(totalReserves.toString()),
      icon: TrendingUp,
      color: 'text-buy',
    },
    {
      label: 'Total LP Supply',
      value: formatTokenAmount(totalSupply.toString()),
      icon: Activity,
      color: 'text-info',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Protocol Overview
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="rounded-lg bg-background/60 border border-border/50 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <p className="text-xs text-text-tertiary uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
            <p className="text-xl font-bold font-mono text-text-primary tabular-nums">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-border/50">
        <p className="text-xs text-text-tertiary">
          Volume tracking requires an indexer. The values shown above reflect
          current on-chain reserves and LP supply at block{' '}
          <span className="font-mono text-text-secondary">
            #{blockHeight.toLocaleString()}
          </span>
          .
        </p>
      </div>
    </div>
  );
}
