'use client';

import useSWR from 'swr';
import { getPoolTwap } from '@/lib/api/pools';
import type { DexTwapResponse } from '@/lib/types/api';

/**
 * Fetch TWAP oracle data for a specific pool with SWR.
 * Refreshes every 15 seconds.
 */
export function useTwap(poolId: number | undefined, window?: number) {
  const { data, error, isLoading, mutate } = useSWR<DexTwapResponse>(
    poolId !== undefined ? `/v1/dex/pools/${poolId}/twap?window=${window ?? 100}` : null,
    () => getPoolTwap(poolId!, window),
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
    },
  );

  return {
    twap: data ?? null,
    isLoading,
    error: error as Error | null,
    mutate,
  };
}
