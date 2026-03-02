'use client';

import useSWR from 'swr';
import { getPools } from '@/lib/api/pools';
import type { DexPoolResponse } from '@/lib/types/api';

/**
 * Fetch all DEX pools with SWR.
 * Automatically refreshes every 10 seconds.
 */
export function usePools() {
  const { data, error, isLoading, mutate } = useSWR<DexPoolResponse[]>(
    '/v1/dex/pools',
    () => getPools(),
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    },
  );

  return {
    pools: data ?? [],
    isLoading,
    error: error as Error | null,
    mutate,
  };
}
