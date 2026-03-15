import { useWalletStore } from '@/stores/wallet';
import { useShallow } from 'zustand/react/shallow';

/**
 * Hook that provides wallet state and actions.
 * Uses a single compound selector to minimize re-renders.
 */
export function useWallet() {
  return useWalletStore(
    useShallow((s) => ({
      address: s.address,
      publicKey: s.publicKey,
      privateKey: s.privateKey,
      isLocked: s.isLocked,
      isConnected: s.isConnected,
      source: s.source,
      create: s.create,
      importKey: s.importKey,
      unlock: s.unlock,
      lock: s.lock,
      disconnect: s.disconnect,
      connectExtension: s.connectExtension,
    })),
  );
}
