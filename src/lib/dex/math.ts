/**
 * Port of DexLibrary AMM math functions.
 * All arithmetic uses native BigInt for precision.
 */

const FEE_DENOM = 10_000n;

/**
 * Calculate the output amount for a given input, reserves, and fee tier.
 * Uses the constant-product formula: x * y = k.
 */
export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number,
): bigint {
  if (amountIn <= 0n) throw new Error('Insufficient input amount');
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('Insufficient liquidity');

  const feeComplement = FEE_DENOM - BigInt(feeBps);
  const amountInWithFee = amountIn * feeComplement;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * FEE_DENOM + amountInWithFee;
  return numerator / denominator;
}

/**
 * Calculate the input amount required to receive a specific output.
 * Rounds up to ensure the output is fully covered.
 */
export function getAmountIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number,
): bigint {
  if (amountOut <= 0n) throw new Error('Insufficient output amount');
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('Insufficient liquidity');
  if (amountOut >= reserveOut) throw new Error('Insufficient liquidity for output');

  const feeComplement = FEE_DENOM - BigInt(feeBps);
  const numerator = reserveIn * amountOut * FEE_DENOM;
  const denominator = (reserveOut - amountOut) * feeComplement;
  // Round up
  return (numerator + denominator - 1n) / denominator;
}

/**
 * Quote the equivalent amount of tokenB given an amount of tokenA
 * at the current reserve ratio, ignoring fees.
 */
export function quote(
  amountA: bigint,
  reserveA: bigint,
  reserveB: bigint,
): bigint {
  if (amountA <= 0n) throw new Error('Insufficient amount');
  if (reserveA <= 0n || reserveB <= 0n) throw new Error('Insufficient liquidity');
  return (amountA * reserveB) / reserveA;
}

/**
 * Calculate the price impact in basis points for a swap.
 * Compares the ideal (zero-fee, zero-impact) output to the actual output.
 */
export function priceImpactBps(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number,
): number {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0;

  const ideal = quote(amountIn, reserveIn, reserveOut);
  const actual = getAmountOut(amountIn, reserveIn, reserveOut, feeBps);

  if (ideal <= 0n) return 0;

  const impact = ((ideal - actual) * FEE_DENOM) / ideal;
  return Number(impact);
}

/**
 * Compute the initial liquidity for a new pool.
 * Uses the geometric mean minus a minimum liquidity lock of 1000.
 */
export function computeInitialLiquidity(
  amount0: bigint,
  amount1: bigint,
): bigint {
  if (amount0 <= 0n || amount1 <= 0n) throw new Error('Amounts must be positive');
  return sqrt(amount0 * amount1) - 1000n;
}

/**
 * Compute the liquidity minted for additional deposits to an existing pool.
 * Returns the minimum of proportional contributions for each token.
 */
export function computeLiquidity(
  amount0: bigint,
  amount1: bigint,
  reserve0: bigint,
  reserve1: bigint,
  totalSupply: bigint,
): bigint {
  if (totalSupply <= 0n) throw new Error('Total supply must be positive');
  if (reserve0 <= 0n || reserve1 <= 0n) throw new Error('Reserves must be positive');

  const liquidity0 = (amount0 * totalSupply) / reserve0;
  const liquidity1 = (amount1 * totalSupply) / reserve1;
  return liquidity0 < liquidity1 ? liquidity0 : liquidity1;
}

/**
 * Integer square root via Newton's method.
 */
function sqrt(n: bigint): bigint {
  if (n < 0n) throw new Error('Square root of negative number');
  if (n === 0n) return 0n;
  if (n === 1n) return 1n;

  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}
