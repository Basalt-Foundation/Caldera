'use client';

import { useRouter } from 'next/navigation';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { truncateAddress } from '@/lib/format/addresses';
import { formatTokenAmount } from '@/lib/format/amounts';
import type { DexPoolResponse } from '@/lib/types/api';

interface PoolRowProps {
  pool: DexPoolResponse;
  getSymbol: (address: string) => string;
}

/**
 * Single pool row with token icons, pair name, truncated addresses, and formatted reserves.
 */
export function PoolRow({ pool, getSymbol }: PoolRowProps) {
  const router = useRouter();
  const label0 = getSymbol(pool.token0);
  const label1 = getSymbol(pool.token1);

  return (
    <tr
      onClick={() => router.push(`/pools/${pool.poolId}`)}
      className="group cursor-pointer border-b border-border/50 last:border-b-0 hover:bg-surface-hover transition-colors"
    >
      {/* Pool (token pair) */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <TokenIcon address={pool.token0} size="sm" symbol={label0} />
            <TokenIcon address={pool.token1} size="sm" symbol={label1} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">
              {label0} / {label1}
            </span>
            <span className="text-xs font-mono text-text-tertiary">
              {truncateAddress(pool.token0, 6, 4)} / {truncateAddress(pool.token1, 6, 4)}
            </span>
          </div>
        </div>
      </td>

      {/* Fee Tier */}
      <td className="py-3 px-4">
        <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-mono text-accent">
          {(pool.feeBps / 100).toFixed(2)}%
        </span>
      </td>

      {/* Reserve 0 */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-mono tabular-nums text-text-primary">
          {formatTokenAmount(pool.reserve0, 18, 4)}
        </span>
      </td>

      {/* Reserve 1 */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-mono tabular-nums text-text-primary">
          {formatTokenAmount(pool.reserve1, 18, 4)}
        </span>
      </td>

      {/* Total Supply */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-mono tabular-nums text-text-primary">
          {formatTokenAmount(pool.totalSupply, 18, 4)}
        </span>
      </td>
    </tr>
  );
}
