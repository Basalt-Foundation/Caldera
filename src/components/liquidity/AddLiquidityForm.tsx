'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { AmountInput } from '@/components/shared/AmountInput';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { usePools } from '@/hooks/usePools';
import { useAccount } from '@/hooks/useAccount';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useWalletStore } from '@/stores/wallet';
import { useSettingsStore } from '@/stores/settings';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType, buildAddLiquidity } from '@/lib/tx/builder';
import { quote } from '@/lib/dex/math';
import { parseTokenAmount, formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { DEX_ADDRESS, GAS_COSTS, BPS_DENOMINATOR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { UnsignedTransaction } from '@/lib/tx/signer';

/**
 * Form to add liquidity to an existing pool.
 * Auto-calculates the paired amount based on current reserve ratio.
 */
export function AddLiquidityForm() {
  const { pools, isLoading: poolsLoading } = usePools();
  const address = useWalletStore((s) => s.address);
  const privateKey = useWalletStore((s) => s.privateKey);
  const isConnected = useWalletStore((s) => s.isConnected);
  const slippageBps = useSettingsStore((s) => s.slippageBps);
  const chainId = useSettingsStore((s) => s.chainId);
  const { account } = useAccount(address ?? undefined);
  const { submit, isLoading: txLoading, error: txError, receipt, reset: resetTx } = useTransaction();

  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);

  const selectedPool = useMemo(
    () => pools.find((p) => p.poolId === selectedPoolId) ?? null,
    [pools, selectedPoolId],
  );

  // Fetch token-specific balances for the selected pool's tokens
  const { balance: token0Balance } = useTokenBalance(
    selectedPool?.token0,
    address ?? undefined,
    account?.balance ?? null,
  );
  const { balance: token1Balance } = useTokenBalance(
    selectedPool?.token1,
    address ?? undefined,
    account?.balance ?? null,
  );
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [lastEdited, setLastEdited] = useState<0 | 1>(0);

  // Auto-calculate paired amount when one side changes
  useEffect(() => {
    if (!selectedPool) return;

    const r0 = BigInt(selectedPool.reserve0);
    const r1 = BigInt(selectedPool.reserve1);
    if (r0 <= 0n || r1 <= 0n) return;

    try {
      if (lastEdited === 0 && amount0) {
        const raw0 = parseTokenAmount(amount0);
        if (raw0 > 0n) {
          const raw1 = quote(raw0, r0, r1);
          setAmount1(formatTokenAmount(raw1, 18, 6));
        }
      } else if (lastEdited === 1 && amount1) {
        const raw1 = parseTokenAmount(amount1);
        if (raw1 > 0n) {
          const raw0 = quote(raw1, r1, r0);
          setAmount0(formatTokenAmount(raw0, 18, 6));
        }
      }
    } catch {
      // Ignore errors during computation
    }
  }, [amount0, amount1, lastEdited, selectedPool]);

  const handleAmount0Change = useCallback((val: string) => {
    setAmount0(val);
    setLastEdited(0);
  }, []);

  const handleAmount1Change = useCallback((val: string) => {
    setAmount1(val);
    setLastEdited(1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPool || !privateKey || !address || !amount0 || !amount1) return;

    const raw0 = parseTokenAmount(amount0);
    const raw1 = parseTokenAmount(amount1);
    const slippageMultiplier = BigInt(BPS_DENOMINATOR) - BigInt(slippageBps);
    const min0 = (raw0 * slippageMultiplier) / BigInt(BPS_DENOMINATOR);
    const min1 = (raw1 * slippageMultiplier) / BigInt(BPS_DENOMINATOR);

    const data = buildAddLiquidity(
      BigInt(selectedPool.poolId),
      raw0,
      raw1,
      min0,
      min1,
    );

    const unsignedTx: UnsignedTransaction = {
      type: TransactionType.DexAddLiquidity,
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
  }, [selectedPool, privateKey, address, amount0, amount1, slippageBps, account, submit]);

  const insufficientBalance = useMemo(() => {
    if (!amount0 || !amount1) return null;
    try {
      const raw0 = parseTokenAmount(amount0);
      const raw1 = parseTokenAmount(amount1);
      if (token0Balance && raw0 > BigInt(token0Balance)) return 'Token 0';
      if (token1Balance && raw1 > BigInt(token1Balance)) return 'Token 1';
    } catch { /* ignore */ }
    return null;
  }, [amount0, amount1, token0Balance, token1Balance]);

  const canSubmit = useMemo(() => {
    if (!isConnected || !selectedPool || !amount0 || !amount1) return false;
    if (insufficientBalance) return false;
    try {
      return parseTokenAmount(amount0) > 0n && parseTokenAmount(amount1) > 0n;
    } catch {
      return false;
    }
  }, [isConnected, selectedPool, amount0, amount1, insufficientBalance]);

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
            setAmount0('');
            setAmount1('');
            resetTx();
          }}
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Select a pool...</option>
          {pools.map((pool) => (
            <option key={pool.poolId} value={pool.poolId}>
              Pool #{pool.poolId} - {truncateAddress(pool.token0)} / {truncateAddress(pool.token1)} ({(pool.feeBps / 100).toFixed(2)}%)
            </option>
          ))}
        </select>
      </div>

      {selectedPool && (
        <>
          {/* Token 0 input */}
          <AmountInput
            label="Token 0"
            value={amount0}
            onChange={handleAmount0Change}
            balance={token0Balance}
            tokenSelector={
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
                <TokenIcon address={selectedPool.token0} size="sm" />
                <span className="font-mono text-xs text-text-secondary">
                  {truncateAddress(selectedPool.token0)}
                </span>
              </div>
            }
          />

          {/* Plus icon */}
          <div className="flex justify-center">
            <div className="p-2 rounded-xl border border-border bg-surface">
              <Plus className="w-4 h-4 text-text-tertiary" />
            </div>
          </div>

          {/* Token 1 input */}
          <AmountInput
            label="Token 1"
            value={amount1}
            onChange={handleAmount1Change}
            balance={token1Balance}
            tokenSelector={
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
                <TokenIcon address={selectedPool.token1} size="sm" />
                <span className="font-mono text-xs text-text-secondary">
                  {truncateAddress(selectedPool.token1)}
                </span>
              </div>
            }
          />

          {/* Slippage info */}
          <div className="flex justify-between text-xs text-text-tertiary p-2">
            <span>Slippage tolerance</span>
            <span className="font-mono">{(slippageBps / 100).toFixed(1)}%</span>
          </div>
        </>
      )}

      {/* Error */}
      {txError && (
        <p className="text-xs text-sell p-2">{txError}</p>
      )}

      {/* Success */}
      {receipt?.success && (
        <p className="text-xs text-buy p-2">Liquidity added successfully!</p>
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
            Adding Liquidity...
          </span>
        ) : !isConnected ? (
          'Connect Wallet'
        ) : !selectedPool ? (
          'Select a Pool'
        ) : insufficientBalance ? (
          `Insufficient ${insufficientBalance} Balance`
        ) : (
          'Add Liquidity'
        )}
      </button>
    </div>
  );
}
