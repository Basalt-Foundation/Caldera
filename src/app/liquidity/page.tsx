'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Layers } from 'lucide-react';
import { AddLiquidityForm } from '@/components/liquidity/AddLiquidityForm';
import { RemoveLiquidityForm } from '@/components/liquidity/RemoveLiquidityForm';
import { ConcentratedRange } from '@/components/liquidity/ConcentratedRange';
import { cn } from '@/lib/utils';

type Tab = 'add' | 'remove' | 'concentrated';

const TABS: { key: Tab; label: string; icon: typeof Plus }[] = [
  { key: 'add', label: 'Add', icon: Plus },
  { key: 'remove', label: 'Remove', icon: Minus },
  { key: 'concentrated', label: 'Concentrated', icon: Layers },
];

/**
 * Liquidity management page with tabs for adding, removing,
 * and managing concentrated liquidity positions.
 */
export default function LiquidityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('add');

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[520px]"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Liquidity</h1>
          <p className="text-sm text-text-secondary mt-1">
            Provide liquidity to earn fees from trades
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-background border border-border p-1 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === key
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'add' && <AddLiquidityForm />}
              {activeTab === 'remove' && <RemoveLiquidityForm />}
              {activeTab === 'concentrated' && <ConcentratedRange />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
