'use client';

import { useNetworkStore } from '@/stores/network';

export function useNetworkStatus() {
  const blockHeight = useNetworkStore((s) => s.blockHeight);
  const isConnected = useNetworkStore((s) => s.isConnected);
  const latestBlockHash = useNetworkStore((s) => s.latestBlockHash);
  const connectionError = useNetworkStore((s) => s.connectionError);

  return { blockHeight, isConnected, latestBlockHash, connectionError };
}
