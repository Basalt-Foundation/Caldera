'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/stores/wallet';
import { formatAddress } from '@/lib/utils';
import { WalletModal } from '@/components/wallet/WalletModal';

export function WalletButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, isLocked, source, extensionDetected, hydrate } = useWalletStore();

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  // Before hydration, always show "Connect Wallet" to match server render
  const label = !mounted
    ? 'Connect Wallet'
    : isConnected && address
      ? formatAddress(address)
      : isLocked
        ? 'Unlock Wallet'
        : 'Connect Wallet';

  const showExtensionDot = mounted && isConnected && source === 'extension';

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={
          isConnected && mounted
            ? 'relative px-4 py-2 text-sm font-mono font-medium rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors text-text-primary'
            : 'px-4 py-2 text-sm font-semibold rounded-lg bg-accent hover:bg-accent-hover transition-colors text-background'
        }
      >
        {showExtensionDot && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-buy border-2 border-background" title="Basalt Wallet Extension" />
        )}
        {label}
      </button>
      <WalletModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
