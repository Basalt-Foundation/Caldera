export const CHAIN_IDS = {
  mainnet: 1,
  testnet: 4242,
  devnet: 31337,
} as const;

export const GAS_COSTS = {
  TransferGas: 21_000,
  DexCreatePoolGas: 100_000,
  DexLiquidityGas: 80_000,
  DexSwapGas: 80_000,
  DexLimitOrderGas: 60_000,
  DexCancelOrderGas: 40_000,
  DexTransferLpGas: 40_000,
  DexApproveLpGas: 30_000,
  DexMintPositionGas: 120_000,
  DexBurnPositionGas: 100_000,
  DexCollectFeesGas: 60_000,
  DexEncryptedSwapIntentGas: 100_000,
} as const;

/** Fee tiers in basis points */
export const FEE_TIERS = [1, 5, 30, 100] as const;

/** Default fee tier in basis points (0.3%) */
export const DEFAULT_FEE_BPS = 30;

/** Minimum liquidity locked on first mint */
export const MIN_LIQUIDITY = 1000n;

/** Basis point denominator (10,000 = 100%) */
export const BPS_DENOMINATOR = 10_000n;

/** Protocol DEX contract address */
export const DEX_ADDRESS = '0x0000000000000000000000000000000000001009';

/** Default slippage tolerance in basis points (0.5%) */
export const DEFAULT_SLIPPAGE_BPS = 50;

/** Default transaction deadline in blocks */
export const DEFAULT_DEADLINE_BLOCKS = 100;

/**
 * Price scale factor used by the batch auction solver: 2^64.
 * All limit order prices are stored as token1-per-token0 multiplied by this constant.
 */
export const PRICE_SCALE = 1n << 64n;

/**
 * Descale a PriceScale-encoded price to an 18-decimal string for formatTokenAmount.
 * Use: formatTokenAmount(descalePrice(rawPrice), 18, 6)
 */
export function descalePrice(priceScaled: string | bigint): string {
  const raw = typeof priceScaled === 'string' ? BigInt(priceScaled) : priceScaled;
  return (raw * 10n ** 18n / PRICE_SCALE).toString();
}

/**
 * Descale a PriceScale-encoded price to a JavaScript number for charting.
 */
export function descalePriceToNumber(priceScaled: string | bigint): number {
  const raw = typeof priceScaled === 'string' ? BigInt(priceScaled) : priceScaled;
  // Use 10^12 intermediate to preserve precision without overflow
  const scaled = raw * 10n ** 12n / PRICE_SCALE;
  return Number(scaled) / 1e12;
}

// ---------------------------------------------------------------------------
// Well-known token registry
// ---------------------------------------------------------------------------

/** Native BSLT — represented as the zero address in DEX context. */
export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

export interface KnownToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

/** System tokens deployed at genesis. */
export const KNOWN_TOKENS: KnownToken[] = [
  {
    address: NATIVE_TOKEN,
    symbol: 'BSLT',
    name: 'Basalt',
    decimals: 18,
  },
  {
    address: '0x0000000000000000000000000000000000001001',
    symbol: 'WBSLT',
    name: 'Wrapped BSLT',
    decimals: 18,
  },
];

/** Lookup a known token by address (case-insensitive). */
export function getKnownToken(address: string): KnownToken | undefined {
  return KNOWN_TOKENS.find(
    (t) => t.address.toLowerCase() === address.toLowerCase(),
  );
}

/**
 * Get a short display label for a token address.
 * Returns the known symbol (e.g. "BSLT") or a hex-derived tag (e.g. "CB").
 */
export function getTokenLabel(address: string): string {
  const known = getKnownToken(address);
  if (known) return known.symbol;
  return address.slice(2, 4).toUpperCase();
}

/** Basalt node REST API URL */
export const API_URL =
  process.env.NEXT_PUBLIC_BASALT_API_URL ?? 'http://localhost:5100';

/** Basalt node WebSocket URL */
export const WS_URL =
  process.env.NEXT_PUBLIC_BASALT_WS_URL ?? 'ws://localhost:5100';
