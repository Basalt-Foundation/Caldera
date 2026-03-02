'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Wallet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Timer,
} from 'lucide-react';
import { useWalletStore } from '@/stores/wallet';
import { useFaucet } from '@/hooks/useFaucet';
import { truncateAddress } from '@/lib/format/addresses';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';

function CooldownTimer({ until }: { until: number }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.ceil((until - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [until]);

  if (remaining <= 0) return null;

  return (
    <div className="flex items-center gap-2 text-text-secondary text-sm">
      <Timer className="w-4 h-4" />
      <span>
        Cooldown: <span className="font-mono">{remaining}s</span>
      </span>
    </div>
  );
}

export default function FaucetPage() {
  const { address, isConnected } = useWalletStore();
  const { drip, isLoading, txHash, error, reset, isOnCooldown, cooldownUntil } =
    useFaucet();

  const handleDrip = () => {
    if (address && !isOnCooldown) {
      drip(address);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader title="Faucet" subtitle="Get testnet BSLT tokens" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8"
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, hsla(33, 95%, 50%, 0.1) 0%, transparent 70%)',
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Drip icon */}
          <motion.div
            className="flex items-center justify-center w-24 h-24 rounded-full mb-6"
            style={{
              background:
                'linear-gradient(135deg, hsla(33, 95%, 50%, 0.15), hsla(20, 90%, 40%, 0.1))',
              border: '1px solid hsla(33, 95%, 50%, 0.2)',
            }}
            animate={
              isLoading
                ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 0px hsla(33, 95%, 50%, 0)',
                      '0 0 30px hsla(33, 95%, 50%, 0.3)',
                      '0 0 0px hsla(33, 95%, 50%, 0)',
                    ],
                  }
                : {}
            }
            transition={
              isLoading
                ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                : {}
            }
          >
            <Droplets
              className={`w-12 h-12 ${isLoading ? 'text-accent animate-pulse' : 'text-accent'}`}
            />
          </motion.div>

          {!isConnected ? (
            <>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Connect wallet first
              </h2>
              <p className="text-sm text-text-secondary mb-6 max-w-xs">
                You need a connected wallet to receive testnet tokens from the
                faucet.
              </p>
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-hover">
                <Wallet className="w-7 h-7 text-text-tertiary" />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Testnet BSLT Faucet
              </h2>
              <p className="text-sm text-text-secondary mb-2">
                Receive tokens to your wallet
              </p>

              {/* Wallet address */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background/60 border border-border/50 mb-6">
                <Wallet className="w-4 h-4 text-text-tertiary" />
                <span className="font-mono text-sm text-text-secondary">
                  {truncateAddress(address!, 10, 8)}
                </span>
              </div>

              {/* Amount display */}
              <div className="mb-6">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                  Amount
                </p>
                <p className="text-3xl font-bold font-mono text-accent tabular-nums">
                  100{' '}
                  <span className="text-lg text-text-secondary">BSLT</span>
                </p>
              </div>

              {/* Drip button */}
              <Button
                onClick={handleDrip}
                loading={isLoading}
                disabled={isOnCooldown}
                size="lg"
                fullWidth
                className="max-w-xs"
              >
                {isOnCooldown
                  ? 'On Cooldown'
                  : isLoading
                    ? 'Requesting...'
                    : 'Request Tokens'}
              </Button>

              {/* Cooldown timer */}
              <AnimatePresence>
                {isOnCooldown && cooldownUntil && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <CooldownTimer until={cooldownUntil} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success state */}
              <AnimatePresence>
                {txHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 w-full max-w-xs"
                  >
                    <div className="rounded-lg bg-buy/10 border border-buy/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-buy" />
                        <span className="text-sm font-medium text-buy">
                          Tokens sent!
                        </span>
                      </div>
                      <a
                        href={`/tx/${txHash}`}
                        className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:text-accent-hover transition-colors break-all"
                      >
                        {txHash.slice(0, 16)}...{txHash.slice(-8)}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error state */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 w-full max-w-xs"
                  >
                    <div className="rounded-lg bg-sell/10 border border-sell/20 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-5 h-5 text-sell" />
                        <span className="text-sm font-medium text-sell">
                          Request failed
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{error}</p>
                      <button
                        onClick={reset}
                        className="mt-2 text-xs text-accent hover:text-accent-hover transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
