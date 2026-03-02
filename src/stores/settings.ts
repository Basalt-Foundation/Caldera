import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SLIPPAGE_BPS, DEFAULT_DEADLINE_BLOCKS, CHAIN_IDS } from '@/lib/constants';

interface SettingsState {
  /** Slippage tolerance in basis points (e.g. 50 = 0.5%) */
  slippageBps: number;
  /** Transaction deadline in blocks */
  deadlineBlocks: number;
  /** Active chain ID */
  chainId: number;
}

interface SettingsActions {
  setSlippage: (bps: number) => void;
  setDeadline: (blocks: number) => void;
  setChainId: (chainId: number) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      slippageBps: DEFAULT_SLIPPAGE_BPS,
      deadlineBlocks: DEFAULT_DEADLINE_BLOCKS,
      chainId: CHAIN_IDS.testnet,

      setSlippage: (bps: number) => set({ slippageBps: bps }),
      setDeadline: (blocks: number) => set({ deadlineBlocks: blocks }),
      setChainId: (chainId: number) => set({ chainId }),
    }),
    {
      name: 'caldera-settings',
    },
  ),
);
