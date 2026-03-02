/**
 * Truncate an address for display.
 *
 * @param addr  - Full hex address (0x...)
 * @param start - Number of leading characters to keep (default 6, includes "0x")
 * @param end   - Number of trailing characters to keep (default 4)
 */
export function truncateAddress(
  addr: string,
  start: number = 6,
  end: number = 4,
): string {
  if (!addr || addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

/**
 * Check whether a string is a valid Basalt address (0x + 40 hex chars).
 */
export function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/**
 * Normalize an address: ensure lowercase with 0x prefix.
 */
export function normalizeAddress(addr: string): string {
  const clean = addr.startsWith('0x') || addr.startsWith('0X')
    ? addr.slice(2)
    : addr;
  return '0x' + clean.toLowerCase();
}
