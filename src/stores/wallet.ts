import { create } from 'zustand';
import {
  generateKeyPair,
  getPublicKey,
  deriveAddress,
} from '@/lib/crypto/ed25519';
import { getExtensionProvider } from '@/lib/wallet/extension';
import type { SignerSource } from '@/hooks/useTransaction';
import {
  encryptKeystore,
  decryptKeystore,
  saveKeystore,
  loadKeystore,
  hasKeystore,
  clearKeystore,
} from '@/lib/crypto/keystore';

/**
 * Where signing happens.
 *
 * 'extension' means the Basalt Wallet holds the key and this app never sees it. 'local' is the
 * in-page keystore, kept for visitors without the extension.
 */
export type WalletKind = 'local' | 'extension';

interface WalletState {
  address: string | null;
  publicKey: Uint8Array | null;
  /** Null under 'extension', where the key never leaves the wallet. */
  privateKey: Uint8Array | null;
  kind: WalletKind;
  isLocked: boolean;
  isConnected: boolean;
}

interface WalletActions {
  /** Ask the extension for an account. It prompts the visitor, and this app never sees a key. */
  connectExtension: () => Promise<void>;
  /** Check localStorage for existing keystore (call after mount). */
  hydrate: () => void;
  /** Generate a new key pair, encrypt, and save to localStorage. */
  create: (password: string) => Promise<void>;
  /** Import a hex-encoded private key, encrypt, and save. */
  importKey: (hexPrivateKey: string, password: string) => Promise<void>;
  /** Unlock a previously saved keystore with a password. */
  unlock: (password: string) => Promise<void>;
  /** Lock the wallet (clear in-memory keys). */
  lock: () => void;
  /** Disconnect and clear the keystore entirely. */
  disconnect: () => void;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export const useWalletStore = create<WalletState & WalletActions>((set) => ({
  // Initial state
  address: null,
  publicKey: null,
  privateKey: null,
  kind: 'local',
  isLocked: false,
  isConnected: false,


  connectExtension: async () => {
    const provider = getExtensionProvider();
    if (!provider) throw new Error('Basalt Wallet is not installed');

    const { accounts } = await provider.connect();
    const address = accounts?.[0];
    if (!address) throw new Error('Basalt Wallet returned no account');

    set({
      address,
      // The public key stays with the wallet, which is also what signs and submits.
      publicKey: null,
      privateKey: null,
      kind: 'extension',
      isLocked: false,
      isConnected: true,
    });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;

    // Ask the extension first. It holds the grant across reloads, so a session it already approved is
    // restored without a prompt, and only then does the local keystore matter.
    const provider = getExtensionProvider();
    if (provider) {
      void provider.getAccounts().then((accounts) => {
        const address = accounts[0];
        if (!address) return;
        set({ address, publicKey: null, privateKey: null, kind: 'extension', isLocked: false, isConnected: true });
      });
    }

    if (hasKeystore()) {
      set({ isLocked: true });
    }
  },

  create: async (password: string) => {
    const { privateKey, publicKey } = generateKeyPair();
    const address = deriveAddress(publicKey);
    const keystoreJson = await encryptKeystore(privateKey, password);
    saveKeystore(keystoreJson);
    set({
      address,
      publicKey,
      privateKey,
      kind: 'local',
      isLocked: false,
      isConnected: true,
    });
  },

  importKey: async (hexPrivateKey: string, password: string) => {
    const privateKey = hexToBytes(hexPrivateKey);
    const publicKey = getPublicKey(privateKey);
    const address = deriveAddress(publicKey);
    const keystoreJson = await encryptKeystore(privateKey, password);
    saveKeystore(keystoreJson);
    set({
      address,
      publicKey,
      privateKey,
      kind: 'local',
      isLocked: false,
      isConnected: true,
    });
  },

  unlock: async (password: string) => {
    const keystoreJson = loadKeystore();
    if (!keystoreJson) {
      throw new Error('No keystore found');
    }
    const privateKey = await decryptKeystore(keystoreJson, password);
    const publicKey = getPublicKey(privateKey);
    const address = deriveAddress(publicKey);
    set({
      address,
      publicKey,
      privateKey,
      kind: 'local',
      isLocked: false,
      isConnected: true,
    });
  },

  lock: () => {
    set({
      privateKey: null,
      isLocked: true,
    });
  },

  disconnect: () => {
    clearKeystore();
    getExtensionProvider()?.disconnect().catch(() => {
      // The site's own state is what matters here. A wallet that did not hear the disconnect is a
      // stale permission the visitor can revoke from the extension, not a reason to fail this.
    });
    set({
      address: null,
      publicKey: null,
      privateKey: null,
      kind: 'local',
      isLocked: false,
      isConnected: false,
    });
  },
}));

/**
 * What should sign, in the form the transaction hook wants.
 *
 * Returns null when nothing is connected, so a caller checks one thing instead of guessing from the
 * absence of a private key. Under the extension there is no private key here by design, and code that
 * tested for one would refuse to send for exactly the visitors it should serve best.
 */
export function useSigner(): SignerSource | null {
  const kind = useWalletStore((s) => s.kind);
  const privateKey = useWalletStore((s) => s.privateKey);
  const isConnected = useWalletStore((s) => s.isConnected);

  if (!isConnected) return null;
  if (kind === 'extension') return { kind: 'extension' };
  return privateKey ? { kind: 'local', privateKey } : null;
}
