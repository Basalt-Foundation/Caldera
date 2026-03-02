'use client';

import { useState, useCallback } from 'react';
import { requestDrip } from '@/lib/api/faucet';

const COOLDOWN_MS = 60_000; // 60 second cooldown

export function useFaucet() {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const drip = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await requestDrip(address);
      setTxHash(result.hash);
      setCooldownUntil(Date.now() + COOLDOWN_MS);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to request drip';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setTxHash(null);
    setError(null);
  }, []);

  const isOnCooldown = cooldownUntil ? Date.now() < cooldownUntil : false;

  return {
    drip,
    isLoading,
    txHash,
    error,
    reset,
    isOnCooldown,
    cooldownUntil,
  };
}
