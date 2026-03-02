import { formatTokenAmount } from '@/lib/format/amounts';
import { descalePrice } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DexTwapResponse } from '@/lib/types/api';

interface PoolStatsProps {
  poolId: number;
  feeBps: number;
  twap: DexTwapResponse | null;
  totalSupply: string;
  className?: string;
}

/**
 * Stats panel showing fee tier, TWAP price, spot price, volatility, and pool ID.
 */
export function PoolStats({
  poolId,
  feeBps,
  twap,
  totalSupply,
  className,
}: PoolStatsProps) {
  const stats = [
    {
      label: 'Pool ID',
      value: `#${poolId}`,
    },
    {
      label: 'Fee Tier',
      value: `${(feeBps / 100).toFixed(2)}%`,
    },
    {
      label: 'TWAP Price',
      value: twap?.twap ? formatTokenAmount(descalePrice(twap.twap), 18, 6) : '---',
    },
    {
      label: 'Spot Price',
      value: twap?.spotPrice ? formatTokenAmount(descalePrice(twap.spotPrice), 18, 6) : '---',
    },
    {
      label: 'Volatility',
      value: twap ? `${(twap.volatilityBps / 100).toFixed(2)}%` : '---',
    },
    {
      label: 'Total Supply',
      value: formatTokenAmount(totalSupply, 18, 4),
    },
    {
      label: 'TWAP Window',
      value: twap ? `${twap.windowBlocks} blocks` : '---',
    },
    {
      label: 'Current Block',
      value: twap ? twap.currentBlock.toLocaleString() : '---',
    },
  ];

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Pool Statistics</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-2.5 rounded-lg bg-background">
            <p className="text-xs text-text-tertiary mb-0.5">{stat.label}</p>
            <p className="text-sm font-mono tabular-nums text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
