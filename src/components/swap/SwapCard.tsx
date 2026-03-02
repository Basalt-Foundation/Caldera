'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowDownUp, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AmountInput } from '@/components/shared/AmountInput';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { SwapSettings } from '@/components/swap/SwapSettings';
import { PriceImpact } from '@/components/swap/PriceImpact';
import { SwapConfirmModal } from '@/components/swap/SwapConfirmModal';
import { useSwapStore } from '@/stores/swap';
import { useWalletStore } from '@/stores/wallet';
import { useAccount } from '@/hooks/useAccount';
import { usePools } from '@/hooks/usePools';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { getAmountOut, getAmountIn, priceImpactBps } from '@/lib/dex/math';
import { parseTokenAmount, formatTokenAmount } from '@/lib/format/amounts';
import { cn } from '@/lib/utils';
import type { DexPoolResponse } from '@/lib/types/api';

/**
 * Main swap interface card.
 * Manages token pair selection, amount input, quote computation, and swap execution.
 */
export function SwapCard() {
  const [flipRotation, setFlipRotation] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Swap store
  const tokenIn = useSwapStore((s) => s.tokenIn);
  const tokenOut = useSwapStore((s) => s.tokenOut);
  const amountIn = useSwapStore((s) => s.amountIn);
  const amountOut = useSwapStore((s) => s.amountOut);
  const direction = useSwapStore((s) => s.direction);
  const selectedPool = useSwapStore((s) => s.selectedPool);
  const setTokenIn = useSwapStore((s) => s.setTokenIn);
  const setTokenOut = useSwapStore((s) => s.setTokenOut);
  const setAmountIn = useSwapStore((s) => s.setAmountIn);
  const setAmountOut = useSwapStore((s) => s.setAmountOut);
  const switchTokens = useSwapStore((s) => s.switchTokens);
  const setPool = useSwapStore((s) => s.setPool);

  // Wallet
  const address = useWalletStore((s) => s.address);
  const isConnected = useWalletStore((s) => s.isConnected);
  const { account } = useAccount(address ?? undefined);

  // Token balance for the selected input token
  const { balance: tokenInBalance } = useTokenBalance(
    tokenIn || undefined,
    address ?? undefined,
    account?.balance ?? null,
  );

  // Pools
  const { pools, isLoading: poolsLoading } = usePools();

  // Find matching pool for selected token pair
  useEffect(() => {
    if (!tokenIn || !tokenOut) {
      setPool(null);
      return;
    }
    const match = pools.find(
      (p) =>
        (p.token0 === tokenIn && p.token1 === tokenOut) ||
        (p.token0 === tokenOut && p.token1 === tokenIn),
    );
    setPool(match ?? null);
  }, [tokenIn, tokenOut, pools, setPool]);

  // Determine if the swap direction is reversed relative to pool ordering
  const isReversed = useMemo(() => {
    if (!selectedPool) return false;
    return selectedPool.token0 === tokenOut;
  }, [selectedPool, tokenOut]);

  // Compute quote
  const quote = useMemo(() => {
    if (!selectedPool || !amountIn) {
      return { amountOut: '', impact: 0, rate: '' };
    }

    try {
      const inputRaw = parseTokenAmount(amountIn);
      if (inputRaw <= 0n) return { amountOut: '', impact: 0, rate: '' };

      const reserveIn = BigInt(isReversed ? selectedPool.reserve1 : selectedPool.reserve0);
      const reserveOut = BigInt(isReversed ? selectedPool.reserve0 : selectedPool.reserve1);

      if (reserveIn <= 0n || reserveOut <= 0n) {
        return { amountOut: '', impact: 0, rate: '' };
      }

      const outputRaw = getAmountOut(inputRaw, reserveIn, reserveOut, selectedPool.feeBps);
      const impact = priceImpactBps(inputRaw, reserveIn, reserveOut, selectedPool.feeBps);

      const outFormatted = formatTokenAmount(outputRaw, 18, 6);

      // Rate: how much tokenOut per 1 tokenIn
      const oneUnit = 10n ** 18n;
      let rateStr = '';
      if (reserveIn > 0n) {
        const rateRaw = getAmountOut(oneUnit, reserveIn, reserveOut, selectedPool.feeBps);
        rateStr = formatTokenAmount(rateRaw, 18, 6);
      }

      return { amountOut: outFormatted, impact, rate: rateStr };
    } catch {
      return { amountOut: '', impact: 0, rate: '' };
    }
  }, [selectedPool, amountIn, isReversed]);

  // Sync computed amountOut to the store when direction is exactIn
  useEffect(() => {
    if (direction === 'exactIn' && quote.amountOut) {
      // Update the store without triggering direction change
      useSwapStore.setState({ amountOut: quote.amountOut });
    }
  }, [direction, quote.amountOut]);

  // Compute exactOut (reverse quote)
  useEffect(() => {
    if (direction !== 'exactOut' || !selectedPool || !amountOut) return;

    try {
      const outputRaw = parseTokenAmount(amountOut);
      if (outputRaw <= 0n) return;

      const reserveIn = BigInt(isReversed ? selectedPool.reserve1 : selectedPool.reserve0);
      const reserveOut = BigInt(isReversed ? selectedPool.reserve0 : selectedPool.reserve1);

      if (reserveIn <= 0n || reserveOut <= 0n || outputRaw >= reserveOut) return;

      const inputRaw = getAmountIn(outputRaw, reserveIn, reserveOut, selectedPool.feeBps);
      useSwapStore.setState({ amountIn: formatTokenAmount(inputRaw, 18, 6) });
    } catch {
      // Ignore computation errors
    }
  }, [direction, amountOut, selectedPool, isReversed]);

  const handleFlip = useCallback(() => {
    setFlipRotation((prev) => prev + 180);
    switchTokens();
  }, [switchTokens]);

  // Button state
  const buttonState = useMemo(() => {
    if (!isConnected) return { label: 'Connect Wallet', disabled: true };
    if (!tokenIn || !tokenOut) return { label: 'Select tokens', disabled: true };
    if (!selectedPool) return { label: 'No liquidity pool', disabled: true };
    if (!amountIn || parseFloat(amountIn) === 0) return { label: 'Enter an amount', disabled: true };

    const inputRaw = parseTokenAmount(amountIn);
    if (tokenInBalance && inputRaw > BigInt(tokenInBalance)) {
      return { label: 'Insufficient balance', disabled: true };
    }

    if (quote.impact > 1000) {
      return { label: 'Swap (High Price Impact)', disabled: false, warn: true };
    }

    return { label: 'Swap', disabled: false };
  }, [isConnected, tokenIn, tokenOut, selectedPool, amountIn, tokenInBalance, quote.impact]);

  return (
    <>
      <div className="w-full max-w-[480px] mx-auto">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Swap</h2>
            <SwapSettings />
          </div>

          {/* Token In */}
          <AmountInput
            label="You pay"
            value={amountIn}
            onChange={setAmountIn}
            balance={tokenInBalance}
            onMax={() => {
              if (tokenInBalance) {
                setAmountIn(formatTokenAmount(tokenInBalance, 18, 18));
              }
            }}
            tokenSelector={
              <TokenSelector
                selected={tokenIn}
                onSelect={setTokenIn}
                excludeAddress={tokenOut}
              />
            }
            loading={poolsLoading}
          />

          {/* Flip button */}
          <div className="flex justify-center -my-2 relative z-10">
            <motion.button
              type="button"
              onClick={handleFlip}
              animate={{ rotate: flipRotation }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors shadow-sm"
              aria-label="Switch tokens"
            >
              <ArrowDownUp className="w-4 h-4 text-text-secondary" />
            </motion.button>
          </div>

          {/* Token Out */}
          <AmountInput
            label="You receive"
            value={direction === 'exactIn' ? (quote.amountOut || amountOut) : amountOut}
            onChange={setAmountOut}
            readOnly={direction === 'exactIn'}
            tokenSelector={
              <TokenSelector
                selected={tokenOut}
                onSelect={setTokenOut}
                excludeAddress={tokenIn}
              />
            }
            loading={poolsLoading}
          />

          {/* Price info */}
          {selectedPool && amountIn && quote.amountOut && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 rounded-xl bg-background border border-border space-y-1.5"
            >
              {quote.rate && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Rate</span>
                  <span className="font-mono text-text-primary">
                    1 = {quote.rate}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Price Impact</span>
                <PriceImpact impactBps={quote.impact} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Fee</span>
                <span className="font-mono text-text-primary">
                  {(selectedPool.feeBps / 100).toFixed(2)}%
                </span>
              </div>
            </motion.div>
          )}

          {/* Price impact warning */}
          {quote.impact > 500 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-sell/10 border border-sell/30"
            >
              <AlertTriangle className="w-4 h-4 text-sell shrink-0 mt-0.5" />
              <p className="text-xs text-sell">
                Price impact is very high ({(quote.impact / 100).toFixed(2)}%).
                You may lose a significant portion of your funds.
              </p>
            </motion.div>
          )}

          {/* Swap button */}
          <button
            type="button"
            disabled={buttonState.disabled}
            onClick={() => setConfirmOpen(true)}
            className={cn(
              'w-full mt-4 py-3.5 rounded-xl font-semibold text-base transition-colors',
              buttonState.disabled
                ? 'bg-border text-text-tertiary cursor-not-allowed'
                : buttonState.warn
                  ? 'bg-sell hover:bg-sell/80 text-white'
                  : 'bg-accent hover:bg-accent-hover text-background',
            )}
          >
            {buttonState.label}
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {selectedPool && (
        <SwapConfirmModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          amountIn={amountIn}
          amountOut={quote.amountOut || amountOut}
          priceImpactBps={quote.impact}
          feeBps={selectedPool.feeBps}
          poolId={selectedPool.poolId}
        />
      )}
    </>
  );
}
