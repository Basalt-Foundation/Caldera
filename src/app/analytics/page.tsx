'use client';

import { motion } from 'framer-motion';
import { BarChart3, Blocks, Activity, Layers } from 'lucide-react';
import { useNetworkStore } from '@/stores/network';
import { usePools } from '@/hooks/usePools';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/shared/Skeleton';
import { TvlChart } from '@/components/analytics/TvlChart';
import { VolumeChart } from '@/components/analytics/VolumeChart';
import { TopPoolsTable } from '@/components/analytics/TopPoolsTable';

export default function AnalyticsPage() {
  const { pools, isLoading } = usePools();
  const { blockHeight, isConnected: isNetworkConnected } = useNetworkStore();

  const networkStats = [
    {
      label: 'Block Height',
      value: blockHeight.toLocaleString(),
      icon: Blocks,
      color: 'text-accent',
    },
    {
      label: 'Total Pools',
      value: pools.length.toString(),
      icon: Layers,
      color: 'text-buy',
    },
    {
      label: 'Network',
      value: isNetworkConnected ? 'Connected' : 'Disconnected',
      icon: Activity,
      color: isNetworkConnected ? 'text-buy' : 'text-sell',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Analytics"
        subtitle="Protocol statistics and pool performance"
      />

      {/* Network Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {networkStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <p className="text-xs text-text-tertiary uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
            <p className="text-2xl font-bold font-mono text-text-primary tabular-nums">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-96" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TVL Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <TvlChart pools={pools} />
          </motion.div>

          {/* Volume / Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <VolumeChart pools={pools} blockHeight={blockHeight} />
          </motion.div>

          {/* Top Pools Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <TopPoolsTable pools={pools} />
          </motion.div>
        </div>
      )}
    </div>
  );
}
