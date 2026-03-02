import { create } from 'zustand';
import type { DexPoolResponse } from '@/lib/types/api';

export type SwapDirection = 'exactIn' | 'exactOut';

interface SwapState {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  direction: SwapDirection;
  selectedPool: DexPoolResponse | null;
}

interface SwapActions {
  setTokenIn: (address: string) => void;
  setTokenOut: (address: string) => void;
  setAmountIn: (amount: string) => void;
  setAmountOut: (amount: string) => void;
  switchTokens: () => void;
  setPool: (pool: DexPoolResponse | null) => void;
  reset: () => void;
}

const initialState: SwapState = {
  tokenIn: '',
  tokenOut: '',
  amountIn: '',
  amountOut: '',
  direction: 'exactIn',
  selectedPool: null,
};

export const useSwapStore = create<SwapState & SwapActions>((set) => ({
  ...initialState,

  setTokenIn: (address: string) =>
    set({ tokenIn: address }),

  setTokenOut: (address: string) =>
    set({ tokenOut: address }),

  setAmountIn: (amount: string) =>
    set({ amountIn: amount, direction: 'exactIn' }),

  setAmountOut: (amount: string) =>
    set({ amountOut: amount, direction: 'exactOut' }),

  switchTokens: () =>
    set((state) => ({
      tokenIn: state.tokenOut,
      tokenOut: state.tokenIn,
      amountIn: state.amountOut,
      amountOut: state.amountIn,
      direction: state.direction === 'exactIn' ? 'exactOut' : 'exactIn',
    })),

  setPool: (pool: DexPoolResponse | null) =>
    set({ selectedPool: pool }),

  reset: () => set(initialState),
}));
