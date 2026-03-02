'use client';

import { useEffect, useRef } from 'react';
import { BlockStreamClient } from '@/lib/ws/blocks';
import { useNetworkStore } from '@/stores/network';

/**
 * Initializes the WebSocket block stream on mount and updates the network store.
 * Disconnects on unmount.
 */
export function useBlockStream(): void {
  const clientRef = useRef<BlockStreamClient | null>(null);
  const setBlock = useNetworkStore((s) => s.setBlock);
  const setConnected = useNetworkStore((s) => s.setConnected);
  const setError = useNetworkStore((s) => s.setError);

  useEffect(() => {
    const client = new BlockStreamClient({
      onBlock: (block) => {
        setBlock(block.number, block.hash);
      },
      onConnect: () => {
        setConnected(true);
        setError(null);
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : 'WebSocket connection error';
        setError(message);
      },
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [setBlock, setConnected, setError]);
}
