'use client';

import { useState } from 'react';
import { Copy, Check, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AccountResponse } from '@/lib/types/api';
import { formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';

interface BalanceCardProps {
  account: AccountResponse;
}

export function BalanceCard({ account }: BalanceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-xl border border-border p-6"
      style={{
        background:
          'linear-gradient(135deg, hsla(20, 5%, 10%, 0.9), hsla(20, 5%, 8%, 0.95))',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, hsla(33, 95%, 50%, 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative">
        {/* Address row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-0.5">
              Account
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-text-secondary">
                {truncateAddress(account.address, 10, 8)}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-buy" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
            Balance
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-text-primary tabular-nums">
              {formatTokenAmount(account.balance)}
            </span>
            <span className="text-lg font-semibold text-accent">BSLT</span>
          </div>
        </div>

        {/* Nonce */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-text-tertiary">Nonce</p>
            <p className="font-mono text-sm text-text-secondary">
              {account.nonce}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Type</p>
            <p className="text-sm text-text-secondary capitalize">
              {account.accountType}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
