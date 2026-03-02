'use client';

import { TokenIcon } from '@/components/shared/TokenIcon';
import { truncateAddress } from '@/lib/format/addresses';
import { formatTokenAmount } from '@/lib/format/amounts';
import { useTokenSymbols } from '@/hooks/useTokenSymbols';
import { cn } from '@/lib/utils';

interface ReservesPanelProps {
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  className?: string;
}

/**
 * Display token reserves with progress bars showing the ratio.
 * Shows token symbols, addresses, formatted amounts, and percentage distribution.
 */
export function ReservesPanel({
  token0,
  token1,
  reserve0,
  reserve1,
  className,
}: ReservesPanelProps) {
  const { getSymbol } = useTokenSymbols([token0, token1]);
  const r0 = BigInt(reserve0);
  const r1 = BigInt(reserve1);
  const total = r0 + r1;

  // Calculate percentages (using number conversion for display)
  let pct0 = 50;
  let pct1 = 50;
  if (total > 0n) {
    pct0 = Number((r0 * 10000n) / total) / 100;
    pct1 = 100 - pct0;
  }

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Reserves</h3>

      <div className="space-y-4">
        {/* Token 0 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <TokenIcon address={token0} size="sm" />
              <span className="text-sm font-semibold text-text-primary">
                {getSymbol(token0)}
              </span>
              <span className="text-xs font-mono text-text-tertiary">
                {truncateAddress(token0)}
              </span>
            </div>
            <span className="text-sm font-mono tabular-nums text-text-primary">
              {formatTokenAmount(reserve0, 18, 4)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${pct0}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-1 text-right">{pct0.toFixed(1)}%</p>
        </div>

        {/* Token 1 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <TokenIcon address={token1} size="sm" />
              <span className="text-sm font-semibold text-text-primary">
                {getSymbol(token1)}
              </span>
              <span className="text-xs font-mono text-text-tertiary">
                {truncateAddress(token1)}
              </span>
            </div>
            <span className="text-sm font-mono tabular-nums text-text-primary">
              {formatTokenAmount(reserve1, 18, 4)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-info transition-all duration-500"
              style={{ width: `${pct1}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-1 text-right">{pct1.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
