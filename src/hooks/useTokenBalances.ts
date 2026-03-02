'use client';

import useSWR from 'swr';
import { callContract } from '@/lib/api/contracts';
import {
  buildBalanceOfCalldata,
  buildSymbolCalldata,
  buildDecimalsCalldata,
} from '@/lib/tx/selector';
import { bytesToHex } from '@/lib/tx/encoder';
import { NATIVE_TOKEN, getKnownToken } from '@/lib/constants';

export interface TokenBalance {
  address: string;
  symbol: string;
  decimals: number;
  balance: bigint;
}

/** Decode a UInt256 (32 bytes LE) from hex return data. */
function decodeUInt256(hex: string): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length === 0) return 0n;
  // LE bytes → bigint
  let result = 0n;
  for (let i = 0; i < clean.length; i += 2) {
    const byteVal = BigInt(parseInt(clean.slice(i, i + 2), 16));
    result |= byteVal << BigInt((i / 2) * 8);
  }
  return result;
}

/** Decode a varint-prefixed UTF-8 string from hex return data. */
function decodeString(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length === 0) return '';
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  // First byte(s): varint length
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

/** Fetch balance for a single BST-20 token. */
async function fetchTokenBalance(
  tokenAddress: string,
  userAddress: string,
): Promise<bigint> {
  const calldata = buildBalanceOfCalldata(userAddress);
  try {
    const res = await callContract({
      to: tokenAddress,
      data: bytesToHex(calldata, true),
      gasLimit: 100_000,
    });
    if (res.success && res.returnData) {
      return decodeUInt256(res.returnData);
    }
  } catch {
    // Token may not exist or not be BST-20
  }
  return 0n;
}

/** Fetch symbol for a BST-20 token. */
async function fetchTokenSymbol(tokenAddress: string): Promise<string> {
  const calldata = buildSymbolCalldata();
  try {
    const res = await callContract({
      to: tokenAddress,
      data: bytesToHex(calldata, true),
      gasLimit: 100_000,
    });
    if (res.success && res.returnData) {
      return decodeString(res.returnData);
    }
  } catch {
    // Ignore
  }
  return '';
}

/** Fetch decimals for a BST-20 token. */
async function fetchTokenDecimals(tokenAddress: string): Promise<number> {
  const calldata = buildDecimalsCalldata();
  try {
    const res = await callContract({
      to: tokenAddress,
      data: bytesToHex(calldata, true),
      gasLimit: 100_000,
    });
    if (res.success && res.returnData) {
      const clean = res.returnData.startsWith('0x')
        ? res.returnData.slice(2)
        : res.returnData;
      if (clean.length >= 2) {
        return parseInt(clean.slice(0, 2), 16);
      }
    }
  } catch {
    // Ignore
  }
  return 18; // Default to 18 decimals
}

// Cache for token metadata (symbol + decimals) — doesn't change
const metadataCache = new Map<string, { symbol: string; decimals: number }>();

async function fetchAllBalances(
  tokenAddresses: string[],
  userAddress: string,
): Promise<TokenBalance[]> {
  const results: TokenBalance[] = [];

  await Promise.all(
    tokenAddresses.map(async (addr) => {
      const balance = await fetchTokenBalance(addr, userAddress);
      if (balance === 0n) return;

      // Check known tokens first, then cache, then fetch
      const known = getKnownToken(addr);
      let symbol: string;
      let decimals: number;

      if (known) {
        symbol = known.symbol;
        decimals = known.decimals;
      } else {
        const cached = metadataCache.get(addr.toLowerCase());
        if (cached) {
          symbol = cached.symbol;
          decimals = cached.decimals;
        } else {
          [symbol, decimals] = await Promise.all([
            fetchTokenSymbol(addr),
            fetchTokenDecimals(addr),
          ]);
          if (!symbol) {
            symbol = addr.slice(0, 6) + '...' + addr.slice(-4);
          }
          metadataCache.set(addr.toLowerCase(), { symbol, decimals });
        }
      }

      results.push({ address: addr, symbol, decimals, balance });
    }),
  );

  // Sort by symbol
  results.sort((a, b) => a.symbol.localeCompare(b.symbol));
  return results;
}

/**
 * Fetch BST-20 token balances for a user across multiple token addresses.
 * Tokens are discovered from DEX pools. Only non-zero balances are returned.
 */
export function useTokenBalances(
  tokenAddresses: string[],
  userAddress?: string,
) {
  // Filter out native token (BSLT) — already shown in BalanceCard
  const tokens = tokenAddresses.filter(
    (a) => a.toLowerCase() !== NATIVE_TOKEN.toLowerCase(),
  );

  const { data, error, isLoading, mutate } = useSWR<TokenBalance[]>(
    userAddress && tokens.length > 0
      ? `token-balances:${userAddress}:${tokens.sort().join(',')}`
      : null,
    () => fetchAllBalances(tokens, userAddress!),
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    },
  );

  return {
    balances: data ?? [],
    isLoading,
    error: error as Error | null,
    mutate,
  };
}
