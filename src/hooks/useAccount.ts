'use client';

import useSWR from 'swr';
import { getAccount } from '@/lib/api/accounts';
import type { AccountResponse } from '@/lib/types/api';

/**
 * Fetch account data for a given address using SWR.
 * Returns { account, isLoading, error, mutate }.
 * If `address` is undefined or empty, the request is skipped.
 */
export function useAccount(address?: string) {
  const { data, error, isLoading, mutate } = useSWR<AccountResponse>(
    address ? `/v1/accounts/${address}` : null,
    () => getAccount(address!),
    {
      refreshInterval: 10_000,
      revalidateOnFocus: false,
    },
  );

  return {
    account: data ?? null,
    isLoading,
    error: error as Error | null,
    mutate,
  };
}
