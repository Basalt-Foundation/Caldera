'use client';

import { useCallback, useState } from 'react';
import { Loader2, ArrowDownToLine, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { truncateAddress } from '@/lib/format/addresses';
import { formatTokenAmount } from '@/lib/format/amounts';
import { useWalletStore } from '@/stores/wallet';
import { useSettingsStore } from '@/stores/settings';
import { useAccount } from '@/hooks/useAccount';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType, buildCollectFees, buildBurnPosition } from '@/lib/tx/builder';
import { DEX_ADDRESS, GAS_COSTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ConcentratedPosition } from '@/lib/types/dex';
import type { UnsignedTransaction } from '@/lib/tx/signer';

interface PositionCardProps {
  position: ConcentratedPosition;
  token0Address: string;
  token1Address: string;
  className?: string;
}

/**
 * Display a concentrated liquidity position with actions to collect fees
 * or burn (remove) the position.
 */
export function PositionCard({
  position,
  token0Address,
  token1Address,
  className,
}: PositionCardProps) {
  const address = useWalletStore((s) => s.address);
  const privateKey = useWalletStore((s) => s.privateKey);
  const isConnected = useWalletStore((s) => s.isConnected);
  const chainId = useSettingsStore((s) => s.chainId);
  const { account } = useAccount(address ?? undefined);
  const { submit, isLoading } = useTransaction();
  const [action, setAction] = useState<'idle' | 'collect' | 'burn'>('idle');

  const handleCollectFees = useCallback(async () => {
    if (!privateKey || !address) return;
    setAction('collect');

    try {
      const data = buildCollectFees(BigInt(position.positionId));

      const unsignedTx: UnsignedTransaction = {
        type: TransactionType.DexCollectFees,
        nonce: account?.nonce ?? 0,
        sender: address,
        to: DEX_ADDRESS,
        value: 0n,
        gasLimit: GAS_COSTS.DexCollectFeesGas,
        gasPrice: 1n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        data,
        priority: 0,
        chainId,
      };

      await submit(unsignedTx, privateKey);
    } finally {
      setAction('idle');
    }
  }, [privateKey, address, position, account, submit]);

  const handleBurnPosition = useCallback(async () => {
    if (!privateKey || !address) return;
    setAction('burn');

    try {
      const data = buildBurnPosition(BigInt(position.positionId), position.liquidity);

      const unsignedTx: UnsignedTransaction = {
        type: TransactionType.DexBurnPosition,
        nonce: account?.nonce ?? 0,
        sender: address,
        to: DEX_ADDRESS,
        value: 0n,
        gasLimit: GAS_COSTS.DexBurnPositionGas,
        gasPrice: 1n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        data,
        priority: 0,
        chainId,
      };

      await submit(unsignedTx, privateKey);
    } finally {
      setAction('idle');
    }
  }, [privateKey, address, position, account, submit]);

  const hasFees = position.token0Owed > 0n || position.token1Owed > 0n;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border bg-surface p-4',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <TokenIcon address={token0Address} size="sm" />
            <TokenIcon address={token1Address} size="sm" />
          </div>
          <span className="text-sm font-semibold text-text-primary">
            Position #{position.positionId}
          </span>
        </div>
        <span className="text-xs font-mono text-text-tertiary">
          Pool #{position.poolId}
        </span>
      </div>

      {/* Tick range */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-background">
          <p className="text-[10px] text-text-tertiary mb-0.5">Lower Tick</p>
          <p className="text-xs font-mono text-text-primary">{position.tickLower}</p>
        </div>
        <div className="p-2 rounded-lg bg-background text-center">
          <p className="text-[10px] text-text-tertiary mb-0.5">Liquidity</p>
          <p className="text-xs font-mono text-text-primary">
            {formatTokenAmount(position.liquidity, 18, 4)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-background text-right">
          <p className="text-[10px] text-text-tertiary mb-0.5">Upper Tick</p>
          <p className="text-xs font-mono text-text-primary">{position.tickUpper}</p>
        </div>
      </div>

      {/* Uncollected fees */}
      {hasFees && (
        <div className="mb-3 p-2.5 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs text-text-secondary mb-1.5">Uncollected Fees</p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <TokenIcon address={token0Address} size="sm" />
              <span className="font-mono tabular-nums text-text-primary">
                {formatTokenAmount(position.token0Owed, 18, 6)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-text-primary">
                {formatTokenAmount(position.token1Owed, 18, 6)}
              </span>
              <TokenIcon address={token1Address} size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {isConnected && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCollectFees}
            disabled={!hasFees || isLoading}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors',
              hasFees && !isLoading
                ? 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30'
                : 'bg-border text-text-tertiary cursor-not-allowed border border-transparent',
            )}
          >
            {action === 'collect' && isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-3 h-3" />
            )}
            Collect Fees
          </button>
          <button
            type="button"
            onClick={handleBurnPosition}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors border',
              isLoading
                ? 'bg-border text-text-tertiary cursor-not-allowed border-transparent'
                : 'bg-sell/10 text-sell hover:bg-sell/20 border-sell/30',
            )}
          >
            {action === 'burn' && isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            Remove
          </button>
        </div>
      )}
    </motion.div>
  );
}
