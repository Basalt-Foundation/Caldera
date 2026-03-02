import { create } from 'zustand';

interface NetworkState {
  blockHeight: number;
  latestBlockHash: string;
  isConnected: boolean;
  connectionError: string | null;

  setBlock: (height: number, hash: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  blockHeight: 0,
  latestBlockHash: '',
  isConnected: false,
  connectionError: null,

  setBlock: (height: number, hash: string) =>
    set({ blockHeight: height, latestBlockHash: hash }),

  setConnected: (connected: boolean) =>
    set({ isConnected: connected, connectionError: connected ? null : undefined }),

  setError: (error: string | null) =>
    set({ connectionError: error }),
}));
