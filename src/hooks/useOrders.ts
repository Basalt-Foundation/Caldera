'use client';

import useSWR from 'swr';
import { getPoolOrders } from '@/lib/api/pools';
import type { DexOrderResponse } from '@/lib/types/api';

/**
 * Fetch orders for a specific pool with SWR.
 * Refreshes every 10 seconds.
 */
export function useOrders(poolId: number | undefined) {
  const { data, error, isLoading, mutate } = useSWR<DexOrderResponse[]>(
    poolId !== undefined ? `/v1/dex/pools/${poolId}/orders` : null,
    () => getPoolOrders(poolId!),
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
    },
  );

  return {
    orders: data ?? [],
    isLoading,
    error: error as Error | null,
    mutate,
  };
}
