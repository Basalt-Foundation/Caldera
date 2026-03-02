'use client';

import useSWR from 'swr';
import { getPriceHistory } from '@/lib/api/pools';
import type { DexPriceHistoryResponse } from '@/lib/types/api';

/**
 * Fetch price history for a specific pool with SWR.
 * Refreshes every 30 seconds.
 */
export function usePriceHistory(
  poolId: number | undefined,
  startBlock: number | undefined,
  endBlock: number | undefined,
  interval: number | undefined,
) {
  const hasParams =
    poolId !== undefined &&
    startBlock !== undefined &&
    endBlock !== undefined &&
    interval !== undefined;

  const { data, error, isLoading, mutate } = useSWR<DexPriceHistoryResponse>(
    hasParams
      ? `/v1/dex/pools/${poolId}/price-history?startBlock=${startBlock}&endBlock=${endBlock}&interval=${interval}`
      : null,
    () => getPriceHistory(poolId!, startBlock!, endBlock!, interval!),
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    },
  );

  return {
    priceHistory: data ?? null,
    isLoading,
    error: error as Error | null,
    mutate,
  };
}
