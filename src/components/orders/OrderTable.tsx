'use client';

import { useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTokenAmount } from '@/lib/format/amounts';
import { useWalletStore } from '@/stores/wallet';
import { useSettingsStore } from '@/stores/settings';
import { useAccount } from '@/hooks/useAccount';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType, buildCancelOrder } from '@/lib/tx/builder';
import { DEX_ADDRESS, GAS_COSTS, PRICE_SCALE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DexOrderResponse } from '@/lib/types/api';
import type { UnsignedTransaction } from '@/lib/tx/signer';

interface OrderTableProps {
  orders: DexOrderResponse[];
  isLoading: boolean;
}

/**
 * Table of active orders with cancel button per row.
 * Color-coded: green for buy, red for sell.
 */
export function OrderTable({ orders, isLoading }: OrderTableProps) {
  if (isLoading) {
    return <OrderTableSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-tertiary text-sm">No active orders</p>
        <p className="text-text-tertiary text-xs mt-1">
          Place a limit order to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2.5 px-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
              ID
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Pool
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Side
            </th>
            <th className="py-2.5 px-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Price
            </th>
            <th className="py-2.5 px-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Amount
            </th>
            <th className="py-2.5 px-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Expiry
            </th>
            <th className="py-2.5 px-3 text-center text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <OrderRow key={order.orderId} order={order} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface OrderRowProps {
  order: DexOrderResponse;
  index: number;
}

function OrderRow({ order, index }: OrderRowProps) {
  const walletAddress = useWalletStore((s) => s.address);
  const privateKey = useWalletStore((s) => s.privateKey);
  const chainId = useSettingsStore((s) => s.chainId);
  const { account } = useAccount(walletAddress ?? undefined);
  const { submit, isLoading } = useTransaction();

  const isOwner = walletAddress?.toLowerCase() === order.owner.toLowerCase();

  const handleCancel = useCallback(async () => {
    if (!privateKey || !walletAddress) return;

    const data = buildCancelOrder(BigInt(order.orderId));

    const unsignedTx: UnsignedTransaction = {
      type: TransactionType.DexCancelOrder,
      nonce: account?.nonce ?? 0,
      sender: walletAddress,
      to: DEX_ADDRESS,
      value: 0n,
      gasLimit: GAS_COSTS.DexCancelOrderGas,
      gasPrice: 1n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      data,
      priority: 0,
      chainId,
    };

    await submit(unsignedTx, privateKey);
  }, [privateKey, walletAddress, order, account, submit]);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-border/50 last:border-b-0 hover:bg-surface-hover/50 transition-colors"
    >
      <td className="py-2.5 px-3">
        <span className="text-xs font-mono text-text-secondary">#{order.orderId}</span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs font-mono text-text-secondary">#{order.poolId}</span>
      </td>
      <td className="py-2.5 px-3">
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
            order.isBuy
              ? 'bg-buy/10 text-buy border border-buy/20'
              : 'bg-sell/10 text-sell border border-sell/20',
          )}
        >
          {order.isBuy ? 'Buy' : 'Sell'}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className="text-xs font-mono tabular-nums text-text-primary">
          {formatTokenAmount((BigInt(order.price) * 10n ** 18n / PRICE_SCALE).toString(), 18, 6)}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className="text-xs font-mono tabular-nums text-text-primary">
          {formatTokenAmount(order.amount, 18, 4)}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className="text-xs font-mono text-text-tertiary">
          Block {order.expiryBlock.toLocaleString()}
        </span>
      </td>
      <td className="py-2.5 px-3 text-center">
        {isOwner && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-sell hover:bg-sell/10 transition-colors disabled:opacity-50"
            title="Cancel order"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <X className="w-3 h-3" />
            )}
            Cancel
          </button>
        )}
      </td>
    </motion.tr>
  );
}

function OrderTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 w-16 rounded bg-border animate-pulse" />
          ))}
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-b border-border/50 px-3 py-3">
          <div className="flex items-center gap-4">
            <div className="h-3 w-8 rounded bg-border animate-pulse" />
            <div className="h-3 w-8 rounded bg-border animate-pulse" />
            <div className="h-5 w-12 rounded bg-border animate-pulse" />
            <div className="flex-1" />
            <div className="h-3 w-20 rounded bg-border animate-pulse" />
            <div className="h-3 w-16 rounded bg-border animate-pulse" />
            <div className="h-3 w-24 rounded bg-border animate-pulse" />
            <div className="h-6 w-16 rounded bg-border animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
