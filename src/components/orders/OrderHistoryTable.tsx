import { truncateAddress } from '@/lib/format/addresses';
import { formatTokenAmount } from '@/lib/format/amounts';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types/dex';

interface OrderHistoryTableProps {
  orders: Order[];
  isLoading: boolean;
}

const STATUS_STYLES: Record<Order['status'], { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-accent/10 text-accent border-accent/20' },
  filled: { label: 'Filled', classes: 'bg-buy/10 text-buy border-buy/20' },
  cancelled: { label: 'Cancelled', classes: 'bg-text-tertiary/10 text-text-tertiary border-text-tertiary/20' },
  expired: { label: 'Expired', classes: 'bg-sell/10 text-sell border-sell/20' },
};

/**
 * Read-only table of historical, filled, or cancelled orders.
 * Shows status column instead of action buttons.
 */
export function OrderHistoryTable({ orders, isLoading }: OrderHistoryTableProps) {
  if (isLoading) {
    return <HistorySkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-tertiary text-sm">No order history</p>
        <p className="text-text-tertiary text-xs mt-1">
          Your past orders will appear here
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
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const style = STATUS_STYLES[order.status];
            return (
              <tr
                key={order.orderId}
                className="border-b border-border/50 last:border-b-0 hover:bg-surface-hover/50 transition-colors"
              >
                <td className="py-2.5 px-3">
                  <span className="text-xs font-mono text-text-secondary">
                    #{order.orderId}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-xs font-mono text-text-secondary">
                    #{order.poolId}
                  </span>
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
                    {formatTokenAmount(order.price, 18, 6)}
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
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
                      style.classes,
                    )}
                  >
                    {style.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 w-16 rounded bg-border animate-pulse" />
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b border-border/50 px-3 py-3">
          <div className="flex items-center gap-4">
            <div className="h-3 w-8 rounded bg-border animate-pulse" />
            <div className="h-3 w-8 rounded bg-border animate-pulse" />
            <div className="h-5 w-12 rounded bg-border animate-pulse" />
            <div className="flex-1" />
            <div className="h-3 w-20 rounded bg-border animate-pulse" />
            <div className="h-3 w-16 rounded bg-border animate-pulse" />
            <div className="h-3 w-24 rounded bg-border animate-pulse" />
            <div className="h-5 w-16 rounded bg-border animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
