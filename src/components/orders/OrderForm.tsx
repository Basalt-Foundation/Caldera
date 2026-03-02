'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AmountInput } from '@/components/shared/AmountInput';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { usePools } from '@/hooks/usePools';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useWalletStore } from '@/stores/wallet';
import { useSettingsStore } from '@/stores/settings';
import { useNetworkStore } from '@/stores/network';
import { useAccount } from '@/hooks/useAccount';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType, buildLimitOrder } from '@/lib/tx/builder';
import { parseTokenAmount, formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { DEX_ADDRESS, GAS_COSTS, PRICE_SCALE, NATIVE_TOKEN } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { UnsignedTransaction } from '@/lib/tx/signer';

/**
 * Form to place a limit order on the DEX.
 * Supports buy/sell toggle, price, amount, and expiry block.
 */
export function OrderForm() {
  const { pools } = usePools();
  const address = useWalletStore((s) => s.address);
  const privateKey = useWalletStore((s) => s.privateKey);
  const isConnected = useWalletStore((s) => s.isConnected);
  const chainId = useSettingsStore((s) => s.chainId);
  const blockHeight = useNetworkStore((s) => s.blockHeight);
  const { account } = useAccount(address ?? undefined);
  const { submit, isLoading: txLoading, error: txError, receipt, reset: resetTx } = useTransaction();

  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [isBuy, setIsBuy] = useState(true);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [expiryBlocks, setExpiryBlocks] = useState(1000);

  const selectedPool = useMemo(
    () => pools.find((p) => p.poolId === selectedPoolId) ?? null,
    [pools, selectedPoolId],
  );

  // Determine the escrow token: buy orders escrow token1, sell orders escrow token0
  const escrowTokenAddress = useMemo(() => {
    if (!selectedPool) return null;
    return isBuy ? selectedPool.token1 : selectedPool.token0;
  }, [selectedPool, isBuy]);

  const isNativeEscrow = escrowTokenAddress?.toLowerCase() === NATIVE_TOKEN.toLowerCase();

  // Fetch BST-20 balance for the escrow token (skipped for native BSLT)
  const escrowTokenAddresses = useMemo(
    () => (escrowTokenAddress && !isNativeEscrow ? [escrowTokenAddress] : []),
    [escrowTokenAddress, isNativeEscrow],
  );
  const { balances: tokenBalances } = useTokenBalances(escrowTokenAddresses, address ?? undefined);

  const escrowBalance = useMemo(() => {
    if (!escrowTokenAddress) return 0n;
    if (isNativeEscrow) {
      return account?.balance ? BigInt(account.balance) : 0n;
    }
    const found = tokenBalances.find(
      (b) => b.address.toLowerCase() === escrowTokenAddress.toLowerCase(),
    );
    return found?.balance ?? 0n;
  }, [escrowTokenAddress, isNativeEscrow, account, tokenBalances]);

  // Compute total value
  const total = useMemo(() => {
    if (!price || !amount) return '';
    try {
      const priceRaw = parseTokenAmount(price);
      const amountRaw = parseTokenAmount(amount);
      const totalRaw = (priceRaw * amountRaw) / (10n ** 18n);
      return formatTokenAmount(totalRaw, 18, 6);
    } catch {
      return '';
    }
  }, [price, amount]);

  const insufficientBalance = useMemo(() => {
    if (!selectedPool || !price || !amount) return false;
    try {
      const priceRaw = parseTokenAmount(price);
      const amountRaw = parseTokenAmount(amount);
      if (priceRaw === 0n || amountRaw === 0n) return false;
      const escrowCost = isBuy ? (priceRaw * amountRaw) / (10n ** 18n) : amountRaw;
      return escrowCost > escrowBalance;
    } catch {
      return false;
    }
  }, [selectedPool, price, amount, isBuy, escrowBalance]);

  const handleSubmit = useCallback(async () => {
    if (!selectedPool || !privateKey || !address || !price || !amount) return;

    const priceRaw = parseTokenAmount(price);
    const priceScaled = (priceRaw * PRICE_SCALE) / 10n ** 18n;
    const amountRaw = parseTokenAmount(amount);
    const expiryBlock = BigInt(blockHeight + expiryBlocks);

    const data = buildLimitOrder(
      BigInt(selectedPool.poolId),
      priceScaled,
      amountRaw,
      isBuy,
      expiryBlock,
    );

    const unsignedTx: UnsignedTransaction = {
      type: TransactionType.DexLimitOrder,
      nonce: account?.nonce ?? 0,
      sender: address,
      to: DEX_ADDRESS,
      value: 0n,
      gasLimit: GAS_COSTS.DexLimitOrderGas,
      gasPrice: 1n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      data,
      priority: 0,
      chainId,
    };

    await submit(unsignedTx, privateKey);
  }, [selectedPool, privateKey, address, price, amount, isBuy, expiryBlocks, blockHeight, account, submit]);

  const canSubmit = useMemo(() => {
    if (!isConnected || !selectedPool || !price || !amount || insufficientBalance) return false;
    try {
      return parseTokenAmount(price) > 0n && parseTokenAmount(amount) > 0n;
    } catch {
      return false;
    }
  }, [isConnected, selectedPool, price, amount, insufficientBalance]);

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
            setPrice('');
            setAmount('');
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

      {/* Buy / Sell toggle */}
      <div>
        <label className="text-sm text-text-secondary mb-2 block">Side</label>
        <div className="flex rounded-xl bg-background border border-border p-1">
          <button
            type="button"
            onClick={() => setIsBuy(true)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
              isBuy
                ? 'bg-buy/20 text-buy border border-buy/30'
                : 'text-text-secondary hover:text-text-primary border border-transparent',
            )}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setIsBuy(false)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
              !isBuy
                ? 'bg-sell/20 text-sell border border-sell/30'
                : 'text-text-secondary hover:text-text-primary border border-transparent',
            )}
          >
            Sell
          </button>
        </div>
      </div>

      {selectedPool && (
        <>
          {/* Price input */}
          <AmountInput
            label="Price"
            value={price}
            onChange={setPrice}
            tokenSelector={
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
                <TokenIcon
                  address={isBuy ? selectedPool.token1 : selectedPool.token0}
                  size="sm"
                />
                <span className="font-mono text-xs text-text-secondary">
                  {truncateAddress(isBuy ? selectedPool.token1 : selectedPool.token0)}
                </span>
              </div>
            }
          />

          {/* Amount input */}
          <AmountInput
            label="Amount"
            value={amount}
            onChange={setAmount}
            tokenSelector={
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
                <TokenIcon
                  address={isBuy ? selectedPool.token0 : selectedPool.token1}
                  size="sm"
                />
                <span className="font-mono text-xs text-text-secondary">
                  {truncateAddress(isBuy ? selectedPool.token0 : selectedPool.token1)}
                </span>
              </div>
            }
          />

          {/* Expiry */}
          <div>
            <label className="text-sm text-text-secondary mb-2 block">
              Expiry (blocks from now)
            </label>
            <input
              type="number"
              min={1}
              value={expiryBlocks}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) setExpiryBlocks(val);
              }}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-text-primary outline-none focus:border-accent/50 transition-colors"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Expires at block ~{(blockHeight + expiryBlocks).toLocaleString()}
            </p>
          </div>

          {/* Order summary */}
          {total && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-xl bg-background border border-border space-y-1.5"
            >
              <p className="text-xs text-text-secondary">Order Summary</p>
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Side</span>
                <span className={cn('font-semibold', isBuy ? 'text-buy' : 'text-sell')}>
                  {isBuy ? 'Buy' : 'Sell'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Total</span>
                <span className="font-mono text-text-primary">{total}</span>
              </div>
            </motion.div>
          )}

          {/* Insufficient balance warning */}
          {insufficientBalance && (
            <div className="p-3 rounded-xl bg-sell/10 border border-sell/20 space-y-1">
              <p className="text-xs font-semibold text-sell">Insufficient balance</p>
              <p className="text-xs text-text-secondary">
                Required: {formatTokenAmount(
                  isBuy
                    ? (parseTokenAmount(price) * parseTokenAmount(amount)) / (10n ** 18n)
                    : parseTokenAmount(amount),
                  18,
                  6,
                )}{' '}
                — Available: {formatTokenAmount(escrowBalance, 18, 6)}
              </p>
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
        <p className="text-xs text-buy p-2">Order placed successfully!</p>
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
            : isBuy
              ? 'bg-buy hover:bg-buy/80 text-white'
              : 'bg-sell hover:bg-sell/80 text-white',
        )}
      >
        {txLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Placing Order...
          </span>
        ) : !isConnected ? (
          'Connect Wallet'
        ) : (
          `Place ${isBuy ? 'Buy' : 'Sell'} Order`
        )}
      </button>
    </div>
  );
}
