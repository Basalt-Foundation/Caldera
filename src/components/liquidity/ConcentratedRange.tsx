'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AmountInput } from '@/components/shared/AmountInput';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { usePools } from '@/hooks/usePools';
import { useWalletStore } from '@/stores/wallet';
import { useSettingsStore } from '@/stores/settings';
import { useAccount } from '@/hooks/useAccount';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType, buildMintPosition } from '@/lib/tx/builder';
import { parseTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { DEX_ADDRESS, GAS_COSTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { UnsignedTransaction } from '@/lib/tx/signer';

const RANGE_PRESETS = [
  { label: 'Full Range', lower: -887272, upper: 887272 },
  { label: 'Narrow', lower: -100, upper: 100 },
  { label: 'Wide', lower: -1000, upper: 1000 },
] as const;

/**
 * Visual tick range selector for concentrated liquidity positions.
 * Allows setting lower and upper ticks, amounts, and minting a position.
 */
export function ConcentratedRange() {
  const { pools } = usePools();
  const address = useWalletStore((s) => s.address);
  const privateKey = useWalletStore((s) => s.privateKey);
  const isConnected = useWalletStore((s) => s.isConnected);
  const chainId = useSettingsStore((s) => s.chainId);
  const { account } = useAccount(address ?? undefined);
  const { submit, isLoading: txLoading, error: txError, receipt, reset: resetTx } = useTransaction();

  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [tickLower, setTickLower] = useState(-1000);
  const [tickUpper, setTickUpper] = useState(1000);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');

  const selectedPool = useMemo(
    () => pools.find((p) => p.poolId === selectedPoolId) ?? null,
    [pools, selectedPoolId],
  );

  // Visual range bar computation
  const rangeBarStyle = useMemo(() => {
    const fullRange = 887272 * 2;
    const normalizedLower = (tickLower + 887272) / fullRange;
    const normalizedUpper = (tickUpper + 887272) / fullRange;
    return {
      left: `${(normalizedLower * 100).toFixed(1)}%`,
      width: `${((normalizedUpper - normalizedLower) * 100).toFixed(1)}%`,
    };
  }, [tickLower, tickUpper]);

  const applyPreset = useCallback((preset: typeof RANGE_PRESETS[number]) => {
    setTickLower(preset.lower);
    setTickUpper(preset.upper);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPool || !privateKey || !address || !amount0 || !amount1) return;

    const raw0 = parseTokenAmount(amount0);
    const raw1 = parseTokenAmount(amount1);

    const data = buildMintPosition(
      BigInt(selectedPool.poolId),
      tickLower,
      tickUpper,
      raw0,
      raw1,
    );

    const unsignedTx: UnsignedTransaction = {
      type: TransactionType.DexMintPosition,
      nonce: account?.nonce ?? 0,
      sender: address,
      to: DEX_ADDRESS,
      value: 0n,
      gasLimit: GAS_COSTS.DexMintPositionGas,
      gasPrice: 1n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      data,
      priority: 0,
      chainId,
    };

    await submit(unsignedTx, privateKey);
  }, [selectedPool, privateKey, address, tickLower, tickUpper, amount0, amount1, account, submit]);

  const canSubmit = useMemo(() => {
    if (!isConnected || !selectedPool || !amount0 || !amount1) return false;
    if (tickLower >= tickUpper) return false;
    try {
      return parseTokenAmount(amount0) > 0n && parseTokenAmount(amount1) > 0n;
    } catch {
      return false;
    }
  }, [isConnected, selectedPool, amount0, amount1, tickLower, tickUpper]);

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
              Pool #{pool.poolId} - {truncateAddress(pool.token0)} / {truncateAddress(pool.token1)}
            </option>
          ))}
        </select>
      </div>

      {selectedPool && (
        <>
          {/* Tick range inputs */}
          <div>
            <label className="text-sm text-text-secondary mb-2 block">Price Range (Ticks)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Lower Tick</label>
                <input
                  type="number"
                  value={tickLower}
                  onChange={(e) => setTickLower(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Upper Tick</label>
                <input
                  type="number"
                  value={tickUpper}
                  onChange={(e) => setTickUpper(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-accent/50"
                />
              </div>
            </div>
          </div>

          {/* Visual range bar */}
          <div className="p-3 rounded-xl bg-background border border-border">
            <div className="relative h-4 rounded-full bg-border overflow-hidden">
              <motion.div
                className="absolute h-full rounded-full bg-accent/40 border border-accent/60"
                animate={rangeBarStyle}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] font-mono text-text-tertiary">
              <span>-887272</span>
              <span>0</span>
              <span>+887272</span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  tickLower === preset.lower && tickUpper === preset.upper
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-background text-text-secondary hover:border-text-tertiary',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Tick validation warning */}
          {tickLower >= tickUpper && (
            <p className="text-xs text-sell px-1">
              Lower tick must be less than upper tick
            </p>
          )}

          {/* Amount inputs */}
          <AmountInput
            label="Token 0 Amount"
            value={amount0}
            onChange={setAmount0}
            tokenSelector={
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
                <TokenIcon address={selectedPool.token0} size="sm" />
                <span className="font-mono text-xs text-text-secondary">
                  {truncateAddress(selectedPool.token0)}
                </span>
              </div>
            }
          />

          <AmountInput
            label="Token 1 Amount"
            value={amount1}
            onChange={setAmount1}
            tokenSelector={
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
                <TokenIcon address={selectedPool.token1} size="sm" />
                <span className="font-mono text-xs text-text-secondary">
                  {truncateAddress(selectedPool.token1)}
                </span>
              </div>
            }
          />
        </>
      )}

      {/* Error */}
      {txError && (
        <p className="text-xs text-sell p-2">{txError}</p>
      )}

      {/* Success */}
      {receipt?.success && (
        <p className="text-xs text-buy p-2">Position minted successfully!</p>
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
            Minting Position...
          </span>
        ) : !isConnected ? (
          'Connect Wallet'
        ) : (
          'Mint Position'
        )}
      </button>
    </div>
  );
}
