'use client';

import { useState, useMemo, useCallback } from 'react';
import { Minus, Loader2 } from 'lucide-react';
import { AmountInput } from '@/components/shared/AmountInput';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { usePools } from '@/hooks/usePools';
import { useWalletStore } from '@/stores/wallet';
import { useSettingsStore } from '@/stores/settings';
import { useAccount } from '@/hooks/useAccount';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType, buildRemoveLiquidity } from '@/lib/tx/builder';
import { parseTokenAmount, formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { DEX_ADDRESS, GAS_COSTS, BPS_DENOMINATOR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { UnsignedTransaction } from '@/lib/tx/signer';

const PERCENTAGE_BUTTONS = [25, 50, 75, 100] as const;

/**
 * Form to remove liquidity from a pool.
 * Includes percentage buttons and preview of tokens to receive.
 */
export function RemoveLiquidityForm() {
  const { pools } = usePools();
  const address = useWalletStore((s) => s.address);
  const privateKey = useWalletStore((s) => s.privateKey);
  const isConnected = useWalletStore((s) => s.isConnected);
  const slippageBps = useSettingsStore((s) => s.slippageBps);
  const chainId = useSettingsStore((s) => s.chainId);
  const { account } = useAccount(address ?? undefined);
  const { submit, isLoading: txLoading, error: txError, receipt, reset: resetTx } = useTransaction();

  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [lpAmount, setLpAmount] = useState('');

  const selectedPool = useMemo(
    () => pools.find((p) => p.poolId === selectedPoolId) ?? null,
    [pools, selectedPoolId],
  );

  // Estimate tokens to receive
  const preview = useMemo(() => {
    if (!selectedPool || !lpAmount) return null;

    try {
      const shares = parseTokenAmount(lpAmount);
      if (shares <= 0n) return null;

      const totalSupply = BigInt(selectedPool.totalSupply);
      if (totalSupply <= 0n) return null;

      const est0 = (shares * BigInt(selectedPool.reserve0)) / totalSupply;
      const est1 = (shares * BigInt(selectedPool.reserve1)) / totalSupply;

      return {
        token0: formatTokenAmount(est0, 18, 6),
        token1: formatTokenAmount(est1, 18, 6),
        raw0: est0,
        raw1: est1,
      };
    } catch {
      return null;
    }
  }, [selectedPool, lpAmount]);

  const handlePercentage = useCallback(
    (pct: number) => {
      if (!selectedPool) return;
      // Use total supply as a proxy for max LP shares (simplified)
      const total = BigInt(selectedPool.totalSupply);
      const shares = (total * BigInt(pct)) / 100n;
      setLpAmount(formatTokenAmount(shares, 18, 18));
    },
    [selectedPool],
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedPool || !privateKey || !address || !preview) return;

    const shares = parseTokenAmount(lpAmount);
    const slippageMultiplier = BigInt(BPS_DENOMINATOR) - BigInt(slippageBps);
    const min0 = (preview.raw0 * slippageMultiplier) / BigInt(BPS_DENOMINATOR);
    const min1 = (preview.raw1 * slippageMultiplier) / BigInt(BPS_DENOMINATOR);

    const data = buildRemoveLiquidity(
      BigInt(selectedPool.poolId),
      shares,
      min0,
      min1,
    );

    const unsignedTx: UnsignedTransaction = {
      type: TransactionType.DexRemoveLiquidity,
      nonce: account?.nonce ?? 0,
      sender: address,
      to: DEX_ADDRESS,
      value: 0n,
      gasLimit: GAS_COSTS.DexLiquidityGas,
      gasPrice: 1n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      data,
      priority: 0,
      chainId,
    };

    await submit(unsignedTx, privateKey);
  }, [selectedPool, privateKey, address, lpAmount, preview, slippageBps, account, submit]);

  const canSubmit = useMemo(() => {
    if (!isConnected || !selectedPool || !preview) return false;
    try {
      return parseTokenAmount(lpAmount) > 0n;
    } catch {
      return false;
    }
  }, [isConnected, selectedPool, preview, lpAmount]);

  return (
    <div className="space-y-4">
      {/* Pool selector */}
      <div>
        <label className="text-sm text-text-secondary mb-2 block">Select Pool</label>
        <select
          value={selectedPoolId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedPoolId(val ? parseInt(val, 10) : null);
            setLpAmount('');
            resetTx();
          }}
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Select a pool...</option>
          {pools.map((pool) => (
            <option key={pool.poolId} value={pool.poolId}>
              Pool #{pool.poolId} - {truncateAddress(pool.token0)} / {truncateAddress(pool.token1)}
            </option>
          ))}
        </select>
      </div>

      {selectedPool && (
        <>
          {/* LP amount input */}
          <AmountInput
            label="LP Shares to Remove"
            value={lpAmount}
            onChange={setLpAmount}
            tokenSelector={
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background">
                <span className="text-xs font-mono text-text-secondary">LP</span>
              </div>
            }
          />

          {/* Percentage buttons */}
          <div className="flex gap-2">
            {PERCENTAGE_BUTTONS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentage(pct)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-border bg-background text-text-secondary hover:border-accent/50 hover:text-accent transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Preview */}
          {preview && (
            <div className="p-3 rounded-xl bg-background border border-border space-y-2">
              <p className="text-xs text-text-secondary mb-2">Estimated to receive</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TokenIcon address={selectedPool.token0} size="sm" />
                  <span className="text-xs font-mono text-text-secondary">
                    {truncateAddress(selectedPool.token0)}
                  </span>
                </div>
                <span className="text-sm font-mono tabular-nums text-text-primary">
                  {preview.token0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TokenIcon address={selectedPool.token1} size="sm" />
                  <span className="text-xs font-mono text-text-secondary">
                    {truncateAddress(selectedPool.token1)}
                  </span>
                </div>
                <span className="text-sm font-mono tabular-nums text-text-primary">
                  {preview.token1}
                </span>
              </div>
              <div className="flex justify-between text-xs text-text-tertiary pt-1 border-t border-border/50">
                <span>Slippage tolerance</span>
                <span className="font-mono">{(slippageBps / 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error */}
      {txError && (
        <p className="text-xs text-sell p-2">{txError}</p>
      )}

      {/* Success */}
      {receipt?.success && (
        <p className="text-xs text-buy p-2">Liquidity removed successfully!</p>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || txLoading}
        className={cn(
          'w-full py-3.5 rounded-xl font-semibold text-base transition-colors',
          !canSubmit || txLoading
            ? 'bg-border text-text-tertiary cursor-not-allowed'
            : 'bg-accent hover:bg-accent-hover text-background',
        )}
      >
        {txLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Removing Liquidity...
          </span>
        ) : !isConnected ? (
          'Connect Wallet'
        ) : (
          'Remove Liquidity'
        )}
      </button>
    </div>
  );
}
