'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PoolTable } from '@/components/pools/PoolTable';
import { PoolSearch } from '@/components/pools/PoolSearch';
import { usePools } from '@/hooks/usePools';

/**
 * Pool list page with search and sortable table.
 */
export default function PoolsPage() {
  const { pools, isLoading } = usePools();
  const [search, setSearch] = useState('');

  const filteredPools = useMemo(() => {
    if (!search.trim()) return pools;
    const q = search.toLowerCase().trim();
    return pools.filter(
      (p) =>
        p.token0.toLowerCase().includes(q) ||
        p.token1.toLowerCase().includes(q) ||
        p.poolId.toString().includes(q),
    );
  }, [pools, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Pools</h1>
            <p className="text-sm text-text-secondary mt-1">
              Browse and explore liquidity pools on Caldera
            </p>
          </div>
          <PoolSearch
            value={search}
            onChange={setSearch}
            className="w-full sm:w-72"
          />
        </div>

        {/* Pool count */}
        {!isLoading && (
          <p className="text-xs text-text-tertiary mb-3">
            {filteredPools.length} pool{filteredPools.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Table */}
        <PoolTable pools={filteredPools} isLoading={isLoading} />
      </motion.div>
    </div>
  );
}
