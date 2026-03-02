/**
 * Transaction data builders for Basalt DEX operations.
 * Each function returns a Uint8Array containing the binary-encoded transaction data.
 * Integer IDs (poolId, orderId, etc.), ticks, and feeBps use big-endian to match
 * the C# TransactionExecutor's BinaryPrimitives.Read*BigEndian calls.
 * UInt256 amounts use little-endian to match the C# UInt256(ReadOnlySpan) constructor.
 */

import {
  writeByte,
  writeUint32BE,
  writeUint64BE,
  writeInt32BE,
  writeUInt256LE,
  writeAddress,
  hexToBytes,
} from './encoder';

export enum TransactionType {
  Transfer = 0,
  ContractDeploy = 1,
  ContractCall = 2,
  StakeDeposit = 3,
  StakeWithdraw = 4,
  ValidatorRegister = 5,
  ValidatorExit = 6,
  DexCreatePool = 7,
  DexAddLiquidity = 8,
  DexRemoveLiquidity = 9,
  DexSwapIntent = 10,
  DexLimitOrder = 11,
  DexCancelOrder = 12,
  DexTransferLp = 13,
  DexApproveLp = 14,
  DexMintPosition = 15,
  DexBurnPosition = 16,
  DexCollectFees = 17,
  DexEncryptedSwapIntent = 18,
  DexAdminPause = 19,
  DexSetParameter = 20,
}

/**
 * Build DexCreatePool data.
 * Layout: [20B token0][20B token1][4B feeBps BE] = 44 bytes
 */
export function buildCreatePool(
  token0: string,
  token1: string,
  feeBps: number,
): Uint8Array {
  const buf = new Uint8Array(44);
  writeAddress(buf, 0, token0);
  writeAddress(buf, 20, token1);
  writeUint32BE(buf, 40, feeBps);
  return buf;
}

/**
 * Build DexAddLiquidity data.
 * Layout: [8B poolId BE][32B amt0Desired LE][32B amt1Desired LE][32B amt0Min LE][32B amt1Min LE] = 136 bytes
 */
export function buildAddLiquidity(
  poolId: bigint,
  amt0Desired: bigint,
  amt1Desired: bigint,
  amt0Min: bigint,
  amt1Min: bigint,
): Uint8Array {
  const buf = new Uint8Array(136);
  writeUint64BE(buf, 0, poolId);
  writeUInt256LE(buf, 8, amt0Desired);
  writeUInt256LE(buf, 40, amt1Desired);
  writeUInt256LE(buf, 72, amt0Min);
  writeUInt256LE(buf, 104, amt1Min);
  return buf;
}

/**
 * Build DexRemoveLiquidity data.
 * Layout: [8B poolId BE][32B shares LE][32B amt0Min LE][32B amt1Min LE] = 104 bytes
 */
export function buildRemoveLiquidity(
  poolId: bigint,
  shares: bigint,
  amt0Min: bigint,
  amt1Min: bigint,
): Uint8Array {
  const buf = new Uint8Array(104);
  writeUint64BE(buf, 0, poolId);
  writeUInt256LE(buf, 8, shares);
  writeUInt256LE(buf, 40, amt0Min);
  writeUInt256LE(buf, 72, amt1Min);
  return buf;
}

/**
 * Build DexSwapIntent data.
 * Layout: [1B version=1][20B tokenIn][20B tokenOut][32B amountIn LE][32B minAmountOut LE][8B deadline BE][1B flags] = 114 bytes
 */
export function buildSwapIntent(
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  minAmountOut: bigint,
  deadline: bigint,
  flags = 0,
): Uint8Array {
  const buf = new Uint8Array(114);
  writeByte(buf, 0, 1); // version
  writeAddress(buf, 1, tokenIn);
  writeAddress(buf, 21, tokenOut);
  writeUInt256LE(buf, 41, amountIn);
  writeUInt256LE(buf, 73, minAmountOut);
  writeUint64BE(buf, 105, deadline);
  writeByte(buf, 113, flags);
  return buf;
}

/**
 * Build DexLimitOrder data.
 * Layout: [8B poolId BE][32B price LE][32B amount LE][1B isBuy][8B expiryBlock BE] = 81 bytes
 */
export function buildLimitOrder(
  poolId: bigint,
  price: bigint,
  amount: bigint,
  isBuy: boolean,
  expiryBlock: bigint,
): Uint8Array {
  const buf = new Uint8Array(81);
  writeUint64BE(buf, 0, poolId);
  writeUInt256LE(buf, 8, price);
  writeUInt256LE(buf, 40, amount);
  writeByte(buf, 72, isBuy ? 1 : 0);
  writeUint64BE(buf, 73, expiryBlock);
  return buf;
}

/**
 * Build DexCancelOrder data.
 * Layout: [8B orderId BE] = 8 bytes
 */
export function buildCancelOrder(orderId: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  writeUint64BE(buf, 0, orderId);
  return buf;
}

/**
 * Build DexTransferLp data.
 * Layout: [8B poolId BE][20B recipient][32B amount LE] = 60 bytes
 */
export function buildTransferLp(
  poolId: bigint,
  recipient: string,
  amount: bigint,
): Uint8Array {
  const buf = new Uint8Array(60);
  writeUint64BE(buf, 0, poolId);
  writeAddress(buf, 8, recipient);
  writeUInt256LE(buf, 28, amount);
  return buf;
}

/**
 * Build DexApproveLp data.
 * Layout: [8B poolId BE][20B spender][32B amount LE] = 60 bytes
 */
export function buildApproveLp(
  poolId: bigint,
  spender: string,
  amount: bigint,
): Uint8Array {
  const buf = new Uint8Array(60);
  writeUint64BE(buf, 0, poolId);
  writeAddress(buf, 8, spender);
  writeUInt256LE(buf, 28, amount);
  return buf;
}

/**
 * Build DexMintPosition data.
 * Layout: [8B poolId BE][4B tickLower BE signed][4B tickUpper BE signed][32B amount0 LE][32B amount1 LE] = 80 bytes
 */
export function buildMintPosition(
  poolId: bigint,
  tickLower: number,
  tickUpper: number,
  amount0: bigint,
  amount1: bigint,
): Uint8Array {
  const buf = new Uint8Array(80);
  writeUint64BE(buf, 0, poolId);
  writeInt32BE(buf, 8, tickLower);
  writeInt32BE(buf, 12, tickUpper);
  writeUInt256LE(buf, 16, amount0);
  writeUInt256LE(buf, 48, amount1);
  return buf;
}

/**
 * Build DexBurnPosition data.
 * Layout: [8B positionId BE][32B liquidity LE] = 40 bytes
 */
export function buildBurnPosition(
  positionId: bigint,
  liquidityAmount: bigint,
): Uint8Array {
  const buf = new Uint8Array(40);
  writeUint64BE(buf, 0, positionId);
  writeUInt256LE(buf, 8, liquidityAmount);
  return buf;
}

/**
 * Build DexCollectFees data.
 * Layout: [8B positionId BE] = 8 bytes
 */
export function buildCollectFees(positionId: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  writeUint64BE(buf, 0, positionId);
  return buf;
}
