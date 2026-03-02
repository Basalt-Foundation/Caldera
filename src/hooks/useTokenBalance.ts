'use client';

import useSWR from 'swr';
import { callContract } from '@/lib/api/contracts';
import { buildBalanceOfCalldata } from '@/lib/tx/selector';
import { bytesToHex } from '@/lib/tx/encoder';
import { NATIVE_TOKEN } from '@/lib/constants';

/** Decode a UInt256 (32 bytes LE) from hex return data. */
function decodeUInt256(hex: string): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length === 0) return 0n;
  let result = 0n;
  for (let i = 0; i < clean.length; i += 2) {
    const byteVal = BigInt(parseInt(clean.slice(i, i + 2), 16));
    result |= byteVal << BigInt((i / 2) * 8);
  }
  return result;
}

async function fetchBst20Balance(
  tokenAddress: string,
  userAddress: string,
): Promise<string> {
  const calldata = buildBalanceOfCalldata(userAddress);
  const res = await callContract({
    to: tokenAddress,
    data: bytesToHex(calldata, true),
    gasLimit: 100_000,
  });
  if (res.success && res.returnData) {
    return decodeUInt256(res.returnData).toString();
  }
  return '0';
}

/**
 * Fetch the balance for a specific token.
 * For native BSLT, returns `nativeBalance` directly.
 * For BST-20 tokens, calls BalanceOf on the contract.
 */
export function useTokenBalance(
  tokenAddress: string | undefined,
  userAddress: string | undefined,
  nativeBalance: string | null,
) {
  const isNative =
    !tokenAddress ||
    tokenAddress.toLowerCase() === NATIVE_TOKEN.toLowerCase();

  const { data, isLoading } = useSWR<string>(
    !isNative && userAddress
      ? `token-balance:${tokenAddress}:${userAddress}`
      : null,
    () => fetchBst20Balance(tokenAddress!, userAddress!),
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
    },
  );

  if (isNative) {
    return { balance: nativeBalance, isLoading: false };
  }

  return { balance: data ?? null, isLoading };
}
