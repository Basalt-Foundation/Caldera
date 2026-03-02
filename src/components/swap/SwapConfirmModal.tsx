'use client';

import { useCallback, useState } from 'react';
import { ArrowDown, Loader2, Check, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/Modal';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { PriceImpact } from '@/components/swap/PriceImpact';
import { truncateAddress } from '@/lib/format/addresses';
import { formatTokenAmount, parseTokenAmount } from '@/lib/format/amounts';
import { useSettingsStore } from '@/stores/settings';
import { useWalletStore } from '@/stores/wallet';
import { useNetworkStore } from '@/stores/network';
import { useAccount } from '@/hooks/useAccount';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType, buildSwapIntent } from '@/lib/tx/builder';
import { DEX_ADDRESS, GAS_COSTS, BPS_DENOMINATOR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { UnsignedTransaction } from '@/lib/tx/signer';

type ConfirmStep = 'review' | 'signing' | 'submitting' | 'confirmed' | 'error';

interface SwapConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpactBps: number;
  feeBps: number;
  poolId: number;
}

/**
 * Confirmation modal for reviewing and executing a swap.
 * Shows summary, then tracks transaction lifecycle.
 */
export function SwapConfirmModal({
  open,
  onOpenChange,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  priceImpactBps,
  feeBps,
  poolId,
}: SwapConfirmModalProps) {
  const [step, setStep] = useState<ConfirmStep>('review');
  const [errorMsg, setErrorMsg] = useState('');

  const slippageBps = useSettingsStore((s) => s.slippageBps);
  const deadlineBlocks = useSettingsStore((s) => s.deadlineBlocks);
  const chainId = useSettingsStore((s) => s.chainId);
  const privateKey = useWalletStore((s) => s.privateKey);
  const walletAddress = useWalletStore((s) => s.address);
  const blockHeight = useNetworkStore((s) => s.blockHeight);
  const { account } = useAccount(walletAddress ?? undefined);
  const { submit, txHash } = useTransaction();

  // Calculate minimum received after slippage
  const amountOutRaw = parseTokenAmount(amountOut);
  const minReceived = amountOutRaw - (amountOutRaw * BigInt(slippageBps)) / BigInt(BPS_DENOMINATOR);

  // Compute the exchange rate
  const rateDisplay = (() => {
    const inVal = parseFloat(amountIn);
    const outVal = parseFloat(amountOut);
    if (inVal > 0 && outVal > 0) {
      return (outVal / inVal).toFixed(6);
    }
    return '---';
  })();

  const handleConfirm = useCallback(async () => {
    if (!privateKey || !walletAddress) {
      setErrorMsg('Wallet is locked');
      setStep('error');
      return;
    }

    try {
      setStep('signing');

      const amountInRaw = parseTokenAmount(amountIn);
      const deadline = BigInt(blockHeight + deadlineBlocks);

      const data = buildSwapIntent(
        tokenIn,
        tokenOut,
        amountInRaw,
        minReceived,
        deadline,
      );

      const unsignedTx: UnsignedTransaction = {
        type: TransactionType.DexSwapIntent,
        nonce: account?.nonce ?? 0,
        sender: walletAddress,
        to: DEX_ADDRESS,
        value: 0n,
        gasLimit: GAS_COSTS.DexSwapGas,
        gasPrice: 1n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        data,
        priority: 0,
        chainId,
      };

      setStep('submitting');
      const receipt = await submit(unsignedTx, privateKey);

      if (receipt && receipt.success) {
        setStep('confirmed');
      } else {
        setErrorMsg(receipt?.errorCode ?? 'Transaction failed');
        setStep('error');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
      setStep('error');
    }
  }, [privateKey, walletAddress, tokenIn, tokenOut, amountIn, minReceived, deadlineBlocks, blockHeight, account, submit]);

  const handleClose = (openState: boolean) => {
    if (!openState) {
      // Reset step when closing
      setTimeout(() => setStep('review'), 200);
      setErrorMsg('');
    }
    onOpenChange(openState);
  };

  return (
    <Modal open={open} onOpenChange={handleClose} title="Review Swap">
      <div className="space-y-4">
        {step === 'review' && (
          <>
            {/* Token In */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div>
                <p className="text-xs text-text-secondary mb-1">You pay</p>
                <p className="text-xl font-mono tabular-nums text-text-primary">
                  {amountIn}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TokenIcon address={tokenIn} size="md" />
                <span className="font-mono text-sm text-text-secondary">
                  {truncateAddress(tokenIn)}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-1">
              <div className="p-1.5 rounded-lg bg-surface border border-border">
                <ArrowDown className="w-4 h-4 text-text-tertiary" />
              </div>
            </div>

            {/* Token Out */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div>
                <p className="text-xs text-text-secondary mb-1">You receive</p>
                <p className="text-xl font-mono tabular-nums text-text-primary">
                  {amountOut}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TokenIcon address={tokenOut} size="md" />
                <span className="font-mono text-sm text-text-secondary">
                  {truncateAddress(tokenOut)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 p-3 rounded-lg bg-background border border-border text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Rate</span>
                <span className="font-mono text-text-primary">{rateDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Price Impact</span>
                <PriceImpact impactBps={priceImpactBps} />
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Min. Received</span>
                <span className="font-mono text-text-primary">
                  {formatTokenAmount(minReceived, 18, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Fee</span>
                <span className="font-mono text-text-primary">
                  {(feeBps / 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Slippage</span>
                <span className="font-mono text-text-primary">
                  {(slippageBps / 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* High impact warning */}
            {priceImpactBps > 500 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-sell/10 border border-sell/30">
                <AlertTriangle className="w-4 h-4 text-sell shrink-0 mt-0.5" />
                <p className="text-xs text-sell">
                  This swap has a high price impact of{' '}
                  {(priceImpactBps / 100).toFixed(2)}%. You may receive significantly
                  less than expected.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={cn(
                'w-full py-3 rounded-xl font-semibold transition-colors',
                priceImpactBps > 1000
                  ? 'bg-sell hover:bg-sell/80 text-white'
                  : 'bg-accent hover:bg-accent-hover text-background',
              )}
            >
              {priceImpactBps > 1000
                ? 'Swap Anyway (High Impact)'
                : 'Confirm Swap'}
            </button>
          </>
        )}

        {/* Transaction lifecycle states */}
        {(step === 'signing' || step === 'submitting' || step === 'confirmed' || step === 'error') && (
          <div className="flex flex-col items-center py-8 gap-4">
            {step === 'signing' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-sm text-text-secondary">Signing transaction...</p>
              </motion.div>
            )}
            {step === 'submitting' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-sm text-text-secondary">Submitting transaction...</p>
                {txHash && (
                  <p className="font-mono text-xs text-text-tertiary break-all">
                    {txHash}
                  </p>
                )}
              </motion.div>
            )}
            {step === 'confirmed' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-buy/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-buy" />
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  Swap Confirmed
                </p>
                {txHash && (
                  <p className="font-mono text-xs text-text-tertiary break-all">
                    {txHash}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="mt-2 px-6 py-2 rounded-lg bg-surface-hover text-sm text-text-primary hover:bg-border transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
            {step === 'error' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-sell/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-sell" />
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  Transaction Failed
                </p>
                <p className="text-xs text-sell text-center">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('review');
                    setErrorMsg('');
                  }}
                  className="mt-2 px-6 py-2 rounded-lg bg-surface-hover text-sm text-text-primary hover:bg-border transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
