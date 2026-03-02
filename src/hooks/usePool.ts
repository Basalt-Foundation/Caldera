'use client';

import useSWR from 'swr';
import { getPool } from '@/lib/api/pools';
import type { DexPoolResponse } from '@/lib/types/api';

/**
 * Fetch a single DEX pool by ID with SWR.
 * Refreshes every 10 seconds.
 */
export function usePool(id: number | undefined) {
  const { data, error, isLoading, mutate } = useSWR<DexPoolResponse>(
    id !== undefined ? `/v1/dex/pools/${id}` : null,
    () => getPool(id!),
    {
      refreshInterval: 10_000,
      revalidateOnFocus: false,
    },
  );

  return {
    pool: data ?? null,
    isLoading,
    error: error as Error | null,
    mutate,
  };
}
