'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useWalletStore } from '@/stores/wallet';
import { useAccount } from '@/hooks/useAccount';
import { usePools } from '@/hooks/usePools';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/shared/Skeleton';
import { BalanceCard } from '@/components/portfolio/BalanceCard';
import { TokenBalancesList } from '@/components/portfolio/TokenBalancesList';
import { LpPositionsList } from '@/components/portfolio/LpPositionsList';
import { TransactionHistory } from '@/components/portfolio/TransactionHistory';
import { Button } from '@/components/shared/Button';

export default function PortfolioPage() {
  const { address, isConnected } = useWalletStore();
  const { account, isLoading: accountLoading } = useAccount(
    address ?? undefined,
  );
  const { pools } = usePools();

  // Discover unique token addresses from DEX pools
  const tokenAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const pool of pools) {
      set.add(pool.token0.toLowerCase());
      set.add(pool.token1.toLowerCase());
    }
    return Array.from(set);
  }, [pools]);

  const { balances: tokenBalances, isLoading: tokensLoading } =
    useTokenBalances(tokenAddresses, address ?? undefined);

  if (!isConnected || !address) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-surface border border-border mb-6">
            <Wallet className="w-10 h-10 text-text-tertiary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Connect wallet to view portfolio
          </h2>
          <p className="text-text-secondary max-w-md mb-8">
            Connect or create a wallet to view your balances, LP positions, and
            transaction history.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Portfolio"
        subtitle="Your balances, positions, and activity"
      />

      {accountLoading && (
        <div className="space-y-6">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-80" />
        </div>
      )}

      {!accountLoading && account && (
        <div className="space-y-6">
          <BalanceCard account={account} />
          <TokenBalancesList
            balances={tokenBalances}
            isLoading={tokensLoading}
          />
          <LpPositionsList pools={pools} />
          <TransactionHistory address={address} />
        </div>
      )}

      {!accountLoading && !account && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-text-secondary mb-2">
            Account not found on-chain.
          </p>
          <p className="text-sm text-text-tertiary mb-6">
            Use the faucet to get testnet BSLT and start trading.
          </p>
          <Button asChild variant="primary">
            <a href="/faucet">Go to Faucet</a>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
