'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Activity,
  Loader2,
} from 'lucide-react';
import { getAccountTransactions } from '@/lib/api/accounts';
import type { TransactionDetailResponse } from '@/lib/types/api';
import { formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { Skeleton } from '@/components/shared/Skeleton';

interface TransactionHistoryProps {
  address: string;
}

function getTxIcon(type: string, sender: string, address: string) {
  const isSender = sender.toLowerCase() === address.toLowerCase();
  if (type === 'Transfer') {
    return isSender ? (
      <ArrowUpRight className="w-4 h-4 text-sell" />
    ) : (
      <ArrowDownLeft className="w-4 h-4 text-buy" />
    );
  }
  return <Activity className="w-4 h-4 text-accent" />;
}

function getTxLabel(type: string, sender: string, address: string): string {
  const isSender = sender.toLowerCase() === address.toLowerCase();
  if (type === 'Transfer') {
    return isSender ? 'Sent' : 'Received';
  }
  return type;
}

export function TransactionHistory({ address }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<
    TransactionDetailResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const txs = await getAccountTransactions(address, 20);
        if (!cancelled) {
          setTransactions(txs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load transactions',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-border bg-surface"
    >
      <div className="flex items-center gap-2 p-5 pb-0 mb-4">
        <Activity className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Recent Transactions
        </h3>
      </div>

      {isLoading && (
        <div className="px-5 pb-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="row" />
          ))}
        </div>
      )}

      {error && (
        <div className="px-5 pb-5">
          <p className="text-sm text-sell">{error}</p>
        </div>
      )}

      {!isLoading && !error && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center px-5 pb-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-hover mb-4">
            <Activity className="w-7 h-7 text-text-tertiary" />
          </div>
          <p className="text-text-secondary font-medium mb-1">
            No transactions yet
          </p>
          <p className="text-sm text-text-tertiary">
            Your transactions will appear here once you start trading.
          </p>
        </div>
      )}

      {!isLoading && !error && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Hash
                </th>
                <th className="text-left px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider hidden sm:table-cell">
                  To
                </th>
                <th className="text-right px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Value
                </th>
                <th className="text-center px-3 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 pb-3 text-xs text-text-tertiary font-medium uppercase tracking-wider hidden md:table-cell">
                  Block
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <motion.tr
                  key={tx.hash}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {getTxIcon(tx.type, tx.sender, address)}
                      <span className="text-text-primary font-medium">
                        {getTxLabel(tx.type, tx.sender, address)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={`/tx/${tx.hash}`}
                      className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      {truncateAddress(tx.hash, 8, 6)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className="font-mono text-xs text-text-secondary">
                      {truncateAddress(tx.to)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono text-text-primary">
                      {formatTokenAmount(tx.value)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {tx.success === true ? (
                      <CheckCircle2 className="w-4 h-4 text-buy mx-auto" />
                    ) : tx.success === false ? (
                      <XCircle className="w-4 h-4 text-sell mx-auto" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-text-tertiary mx-auto animate-spin" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-right hidden md:table-cell">
                    <span className="font-mono text-xs text-text-tertiary">
                      {tx.blockNumber ?? '---'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
