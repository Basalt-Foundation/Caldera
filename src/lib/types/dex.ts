import type { DexPoolResponse, DexOrderResponse } from './api';

export interface Pool extends DexPoolResponse {
  token0Symbol?: string;
  token1Symbol?: string;
  tvl?: string;
  volume24h?: string;
  apr?: string;
}

export interface Order extends DexOrderResponse {
  status: 'active' | 'filled' | 'cancelled' | 'expired';
}

export type SwapDirection = 'exactIn' | 'exactOut';

export interface SwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  priceImpactBps: number;
  fee: bigint;
  route: number[]; // pool IDs
}

export interface LiquidityPosition {
  poolId: number;
  shares: bigint;
  token0Amount: bigint;
  token1Amount: bigint;
}

export interface ConcentratedPosition {
  positionId: number;
  poolId: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  token0Owed: bigint;
  token1Owed: bigint;
}
