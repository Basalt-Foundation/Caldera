'use client';

import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { formatTokenAmount } from '@/lib/format/amounts';
import type { TokenBalance } from '@/hooks/useTokenBalances';

interface TokenBalancesListProps {
  balances: TokenBalance[];
  isLoading: boolean;
}

export function TokenBalancesList({
  balances,
  isLoading,
}: TokenBalancesListProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Token Balances
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-surface-hover rounded-lg" />
          <div className="h-12 bg-surface-hover rounded-lg" />
        </div>
      </motion.div>
    );
  }

  if (balances.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="rounded-xl border border-border bg-surface p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Coins className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Token Balances
        </h3>
      </div>

      <div className="space-y-2">
        {balances.map((token) => (
          <div
            key={token.address}
            className="flex items-center justify-between py-3 px-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
          >
            <div className="flex items-center gap-3">
              <TokenIcon address={token.address} size="md" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {token.symbol}
                </p>
                <p className="text-xs font-mono text-text-tertiary">
                  {token.address.slice(0, 8)}...{token.address.slice(-6)}
                </p>
              </div>
            </div>
            <span className="text-sm font-mono tabular-nums text-text-primary">
              {formatTokenAmount(token.balance, token.decimals)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
