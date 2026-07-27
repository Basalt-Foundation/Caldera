/**
 * Format a token amount (in smallest units) for display.
 *
 * @param value       - Raw integer value (bigint or decimal string)
 * @param decimals    - Number of decimal places the token uses (default 18)
 * @param displayDecimals - Max decimals to show in output (default 6)
 */
export function formatTokenAmount(
  value: bigint | string,
  decimals: number = 18,
  displayDecimals: number = 6,
): string {
  const raw = typeof value === 'string' ? BigInt(value) : value;
  const isNegative = raw < 0n;
  const abs = isNegative ? -raw : raw;

  const divisor = 10n ** BigInt(decimals);
  const integerPart = abs / divisor;
  const fractionalPart = abs % divisor;

  // Pad fractional part to full `decimals` width, then trim to displayDecimals
  const fracStr = fractionalPart.toString().padStart(decimals, '0').slice(0, displayDecimals);

  // Remove trailing zeros
  const trimmedFrac = fracStr.replace(/0+$/, '');

  // Add thousands separators to integer part
  const intStr = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const sign = isNegative ? '-' : '';
  return trimmedFrac.length > 0
    ? `${sign}${intStr}.${trimmedFrac}`
    : `${sign}${intStr}`;
}

/**
 * Parse a human-readable token amount string into the smallest unit bigint.
 *
 * @param value    - Human-readable amount (e.g. "1.5")
 * @param decimals - Number of decimal places the token uses (default 18)
 */
export function parseTokenAmount(
  value: string,
  decimals: number = 18,
): bigint {
  const clean = value.replace(/,/g, '').trim();
  if (!clean || clean === '.') return 0n;

  const [intPart = '0', fracPart = ''] = clean.split('.');
  const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(intPart + paddedFrac);
}

/**
 * Format a number as USD.
 */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a gas price without ever showing a nonzero amount as zero.
 *
 * Gas prices are tiny by nature: a base fee of 1 unit renders as 0.000000000 BSLT and gets trimmed to
 * "0", so a receipt claimed the sender paid nothing when they had not. Below the point where BSLT can
 * express it, the raw count of base units is shown instead, which is exact and cannot be mistaken for
 * free.
 */
export function formatGasPrice(value: bigint | string, decimals: number = 18): string {
  const raw = typeof value === 'string' ? BigInt(value) : value;
  if (raw === 0n) return '0 BSLT';

  const asToken = formatTokenAmount(raw, decimals, 9);
  if (Number(asToken.replace(/[^0-9.]/g, '')) > 0) return `${asToken} BSLT`;

  return `${raw.toLocaleString()} ${raw === 1n ? 'unit' : 'units'}`;
}
