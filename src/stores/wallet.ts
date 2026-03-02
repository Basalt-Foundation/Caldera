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

interface WalletState {
  address: string | null;
  publicKey: Uint8Array | null;
  privateKey: Uint8Array | null;
  isLocked: boolean;
  isConnected: boolean;
}

interface WalletActions {
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
  isLocked: false,
  isConnected: false,

  hydrate: () => {
    if (typeof window !== 'undefined' && hasKeystore()) {
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
    set({
      address: null,
      publicKey: null,
      privateKey: null,
      isLocked: false,
      isConnected: false,
    });
  },
}));
