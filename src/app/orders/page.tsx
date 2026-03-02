'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock, History } from 'lucide-react';
import { OrderForm } from '@/components/orders/OrderForm';
import { OrderTable } from '@/components/orders/OrderTable';
import { OrderHistoryTable } from '@/components/orders/OrderHistoryTable';
import { usePools } from '@/hooks/usePools';
import { useOrders } from '@/hooks/useOrders';
import { useWalletStore } from '@/stores/wallet';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types/dex';

type Tab = 'place' | 'active' | 'history';

const TABS: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: 'place', label: 'Place Order', icon: ClipboardList },
  { key: 'active', label: 'Active Orders', icon: Clock },
  { key: 'history', label: 'History', icon: History },
];

/**
 * Orders page with tabs for placing, viewing active, and historical orders.
 */
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('place');
  const { pools } = usePools();
  const address = useWalletStore((s) => s.address);

  // Fetch orders for all pools (simplified: use first pool or no pool)
  // In a full implementation, this would aggregate orders across pools
  const firstPoolId = pools.length > 0 ? pools[0].poolId : undefined;
  const { orders: allOrders, isLoading: ordersLoading } = useOrders(firstPoolId);

  // Filter active orders by wallet address
  const activeOrders = useMemo(
    () =>
      address
        ? allOrders.filter((o) => o.owner.toLowerCase() === address.toLowerCase())
        : allOrders,
    [allOrders, address],
  );

  // History: For now, empty since we only have active orders from the API
  // In a full implementation, this would come from a separate endpoint
  const historyOrders: Order[] = [];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
          <p className="text-sm text-text-secondary mt-1">
            Place and manage limit orders on the DEX
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'place' && (
              <div className="max-w-[520px] mx-auto rounded-2xl border border-border bg-surface p-5">
                <OrderForm />
              </div>
            )}

            {activeTab === 'active' && (
              <OrderTable orders={activeOrders} isLoading={ordersLoading} />
            )}

            {activeTab === 'history' && (
              <OrderHistoryTable orders={historyOrders} isLoading={false} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
