'use client';

import useSWR from 'swr';
import { callContract } from '@/lib/api/contracts';
import { buildSymbolCalldata } from '@/lib/tx/selector';
import { bytesToHex } from '@/lib/tx/encoder';
import { getKnownToken } from '@/lib/constants';

/** Decode a varint-prefixed UTF-8 string from hex return data. */
function decodeString(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length === 0) return '';
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  let len = 0;
  let shift = 0;
  let idx = 0;
  for (; idx < bytes.length; idx++) {
    len |= (bytes[idx] & 0x7f) << shift;
    if ((bytes[idx] & 0x80) === 0) {
      idx++;
      break;
    }
    shift += 7;
  }
  const strBytes = bytes.slice(idx, idx + len);
  return new TextDecoder().decode(new Uint8Array(strBytes));
}

// Module-level cache — survives re-renders, shared across all hook instances
const symbolCache = new Map<string, string>();

/** Fetch symbol for a single BST-20 token from chain. */
async function fetchSymbol(address: string): Promise<string> {
  const calldata = buildSymbolCalldata();
  try {
    const res = await callContract({
      to: address,
      data: bytesToHex(calldata, true),
      gasLimit: 100_000,
    });
    if (res.success && res.returnData) {
      return decodeString(res.returnData);
    }
  } catch {
    // Token may not exist or not be BST-20
  }
  return '';
}

/**
 * Resolve symbols for a list of token addresses.
 * Known tokens resolve instantly; unknown tokens are fetched from chain and cached.
 */
async function resolveSymbols(
  addresses: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const toFetch: string[] = [];

  for (const addr of addresses) {
    const lower = addr.toLowerCase();
    const known = getKnownToken(addr);
    if (known) {
      result[lower] = known.symbol;
    } else if (symbolCache.has(lower)) {
      result[lower] = symbolCache.get(lower)!;
    } else {
      toFetch.push(addr);
    }
  }

  if (toFetch.length > 0) {
    const fetched = await Promise.all(
      toFetch.map(async (addr) => {
        const symbol = await fetchSymbol(addr);
        return { addr, symbol };
      }),
    );
    for (const { addr, symbol } of fetched) {
      const lower = addr.toLowerCase();
      const resolved = symbol || addr.slice(2, 4).toUpperCase();
      symbolCache.set(lower, resolved);
      result[lower] = resolved;
    }
  }

  return result;
}

/**
 * Hook to resolve token symbols for a list of addresses.
 * Returns a lookup function that maps an address to its symbol.
 * Known tokens resolve instantly; BST-20 tokens are fetched from chain.
 */
export function useTokenSymbols(addresses: string[]) {
  const dedupedKey =
    addresses.length > 0
      ? `token-symbols:${[...new Set(addresses.map((a) => a.toLowerCase()))].sort().join(',')}`
      : null;

  const { data, isLoading } = useSWR<Record<string, string>>(
    dedupedKey,
    () => resolveSymbols(addresses),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  /** Get symbol for an address. Falls back to hex-derived tag while loading. */
  const getSymbol = (address: string): string => {
    const lower = address.toLowerCase();
    // Check SWR data first
    if (data?.[lower]) return data[lower];
    // Check known tokens
    const known = getKnownToken(address);
    if (known) return known.symbol;
    // Check module cache (may be populated from a previous render)
    if (symbolCache.has(lower)) return symbolCache.get(lower)!;
    // Hex fallback
    return address.slice(2, 4).toUpperCase();
  };

  return { getSymbol, isLoading };
}
