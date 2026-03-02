import { useWalletStore } from '@/stores/wallet';

/**
 * Hook that provides wallet state and actions.
 */
export function useWallet() {
  const address = useWalletStore((s) => s.address);
  const publicKey = useWalletStore((s) => s.publicKey);
  const privateKey = useWalletStore((s) => s.privateKey);
  const isLocked = useWalletStore((s) => s.isLocked);
  const isConnected = useWalletStore((s) => s.isConnected);
  const create = useWalletStore((s) => s.create);
  const importKey = useWalletStore((s) => s.importKey);
  const unlock = useWalletStore((s) => s.unlock);
  const lock = useWalletStore((s) => s.lock);
  const disconnect = useWalletStore((s) => s.disconnect);

  return {
    address,
    publicKey,
    privateKey,
    isLocked,
    isConnected,
    create,
    importKey,
    unlock,
    lock,
    disconnect,
  };
}
