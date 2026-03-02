'use client';

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/stores/settings';
import { useNetworkStore } from '@/stores/network';
import { getStatus } from '@/lib/api/status';
import { CHAIN_IDS } from '@/lib/constants';

const POLL_INTERVAL = 10_000; // 10s

function getNetworkName(chainId: number): string {
  switch (chainId) {
    case CHAIN_IDS.mainnet:
      return 'Mainnet';
    case CHAIN_IDS.testnet:
      return 'Testnet';
    case CHAIN_IDS.devnet:
      return 'Devnet';
    default:
      return `Chain ${chainId}`;
  }
}

export function NetworkBadge() {
  const chainId = useSettingsStore((s) => s.chainId);
  const networkName = getNetworkName(chainId);
  const blockHeight = useNetworkStore((s) => s.blockHeight);
  const isConnected = useNetworkStore((s) => s.isConnected);
  const setBlock = useNetworkStore((s) => s.setBlock);
  const setConnected = useNetworkStore((s) => s.setConnected);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const status = await getStatus();
        if (cancelled) return;
        setConnected(true);
        setBlock(status.blockHeight, status.latestBlockHash);
      } catch {
        if (cancelled) return;
        setConnected(false);
      }
    }

    // Poll immediately, then every POLL_INTERVAL
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setBlock, setConnected]);

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs">
      <span
        className={`h-2 w-2 rounded-full ${isConnected ? 'bg-buy' : 'bg-sell'}`}
      />
      <span className="text-text-secondary font-medium">{networkName}</span>
      {blockHeight > 0 && (
        <span className="text-text-tertiary font-mono">
          #{blockHeight.toLocaleString()}
        </span>
      )}
    </div>
  );
}
