import { create } from 'zustand';
import {
  generateKeyPair,
  getPublicKey,
  deriveAddress,
} from '@/lib/crypto/ed25519';
import {
  encryptKeystore,
  decryptKeystore,
  saveKeystore,
  loadKeystore,
  hasKeystore,
  clearKeystore,
} from '@/lib/crypto/keystore';
import type { BasaltProvider } from '@/lib/types/basalt-provider';

export type WalletSource = 'local' | 'extension' | null;

interface WalletState {
  address: string | null;
  publicKey: Uint8Array | null;
  privateKey: Uint8Array | null;
  isLocked: boolean;
  isConnected: boolean;
  /** How the wallet is connected: 'local' (in-browser keystore) or 'extension' (Basalt Wallet). */
  source: WalletSource;
  /** Whether the Basalt Wallet extension is detected on the page. */
  extensionDetected: boolean;
}

interface WalletActions {
  /** Check localStorage for existing keystore (call after mount). */
  hydrate: () => void;
  /** Detect if window.basalt extension is available. */
  detectExtension: () => void;
  /** Connect via Basalt Wallet browser extension. */
  connectExtension: () => Promise<void>;
  /** Generate a new key pair, encrypt, and save to localStorage. */
  create: (password: string) => Promise<void>;
  /** Import a hex-encoded private key, encrypt, and save. */
  importKey: (hexPrivateKey: string, password: string) => Promise<void>;
  /** Unlock a previously saved keystore with a password. */
  unlock: (password: string) => Promise<void>;
  /** Lock the wallet (clear in-memory keys). */
  lock: () => void;
  /** Disconnect and clear the keystore / extension connection. */
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

let _hydrated = false;

function getProvider(): BasaltProvider | undefined {
  return typeof window !== 'undefined' ? window.basalt : undefined;
}

export const useWalletStore = create<WalletState & WalletActions>((set, get) => ({
  // Initial state
  address: null,
  publicKey: null,
  privateKey: null,
  isLocked: false,
  isConnected: false,
  source: null,
  extensionDetected: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    if (_hydrated) return; // Prevent duplicate event listener registration
    _hydrated = true;

    // Detect extension
    get().detectExtension();

    // Check for local keystore
    if (hasKeystore()) {
      set({ isLocked: true });
    }

    // Listen for extension events
    const provider = getProvider();
    if (provider) {
      provider.on('accountsChanged', (accounts) => {
        const { source } = get();
        if (source === 'extension') {
          const accs = accounts as string[];
          set({ address: accs[0] ?? null, isConnected: accs.length > 0 });
        }
      });
      provider.on('disconnect', () => {
        const { source } = get();
        if (source === 'extension') {
          set({ address: null, isConnected: false, source: null });
        }
      });
    }
  },

  detectExtension: () => {
    const provider = getProvider();
    if (provider?.isBasalt) {
      set({ extensionDetected: true });
      // If already connected from a previous session, restore state
      if (provider.connected && provider.accounts.length > 0) {
        set({
          address: provider.accounts[0],
          isConnected: true,
          source: 'extension',
          isLocked: false,
        });
      }
    } else if (typeof window !== 'undefined') {
      // Extension might not be injected yet — listen for init event
      const handler = () => {
        const p = getProvider();
        if (p?.isBasalt) {
          set({ extensionDetected: true });
          if (p.connected && p.accounts.length > 0) {
            set({ address: p.accounts[0], isConnected: true, source: 'extension', isLocked: false });
          }
        }
      };
      window.addEventListener('basalt#initialized', handler, { once: true });
      // Clean up after 5s if extension never shows up
      setTimeout(() => window.removeEventListener('basalt#initialized', handler), 5000);
    }
  },

  connectExtension: async () => {
    const provider = getProvider();
    if (!provider) throw new Error('Basalt Wallet extension not found');

    const result = await provider.connect();
    set({
      address: result.accounts[0] ?? null,
      publicKey: null,
      privateKey: null,
      isLocked: false,
      isConnected: result.accounts.length > 0,
      source: 'extension',
    });
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
      isLocked: false,
      isConnected: true,
      source: 'local',
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
      isLocked: false,
      isConnected: true,
      source: 'local',
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
      isLocked: false,
      isConnected: true,
      source: 'local',
    });
  },

  lock: () => {
    const { source } = get();
    if (source === 'extension') {
      // Extension manages its own lock state
      return;
    }
    set({ privateKey: null, isLocked: true });
  },

  disconnect: () => {
    const { source } = get();
    if (source === 'extension') {
      const provider = getProvider();
      provider?.disconnect().catch(() => {});
    } else {
      clearKeystore();
    }
    set({
      address: null,
      publicKey: null,
      privateKey: null,
      isLocked: false,
      isConnected: false,
      source: null,
    });
  },
}));
