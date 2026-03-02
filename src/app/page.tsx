'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Shield,
  Target,
  Lock,
  ArrowRight,
  Blocks,
  Layers,
  Activity,
  BookOpen,
  TrendingUp,
  Users,
  Zap,
  Ban,
  Eye,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { useNetworkStore } from '@/stores/network';
import { usePools } from '@/hooks/usePools';
import { formatTokenAmount } from '@/lib/format/amounts';
import { truncateAddress } from '@/lib/format/addresses';
import { TokenIcon } from '@/components/shared/TokenIcon';
import { Button } from '@/components/shared/Button';

/* -------------------------------------------------------------------------- */
/*  Animated section wrapper — fades in on viewport entry                      */
/* -------------------------------------------------------------------------- */

function FadeInSection({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature cards data                                                         */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    icon: Shield,
    title: 'Batch Auctions',
    description:
      'All swap intents settle at a single uniform clearing price per block. No ordering advantage — front-running and sandwich attacks are structurally impossible.',
    inspiration: 'CoW Protocol / fm-AMM',
  },
  {
    icon: Target,
    title: 'Concentrated Liquidity',
    description:
      'Deploy liquidity within custom price ranges for maximum capital efficiency. Uniswap v3-style tick-based positions with tick bitmap traversal.',
    inspiration: 'Uniswap v3',
  },
  {
    icon: Lock,
    title: 'Encrypted Intents',
    description:
      'EC-ElGamal key exchange + AES-256-GCM authenticated encryption. Intent contents are hidden until threshold-decrypted by validators at settlement.',
    inspiration: 'DKG + Threshold Crypto',
  },
  {
    icon: BookOpen,
    title: 'Hybrid Order Book',
    description:
      'On-chain limit orders persist until filled, expired, or canceled. Orders cross at the batch clearing price alongside AMM liquidity for deeper markets.',
    inspiration: 'Hyperliquid',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Fees',
    description:
      'Fees adjust automatically based on price volatility — tightening in calm markets (1 bps floor) and widening during turbulence (500 bps cap) to protect LPs.',
    inspiration: 'Ambient Finance',
  },
  {
    icon: Users,
    title: 'Solver Network',
    description:
      'External solvers compete to provide optimal settlement. Surplus-based scoring ensures users get the best price. Solvers earn a share of AMM fees as reward.',
    inspiration: 'UniswapX',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  MEV protection table                                                       */
/* -------------------------------------------------------------------------- */

const MEV_ATTACKS = [
  {
    attack: 'Front-running',
    icon: Zap,
    reason: 'Uniform clearing price — order within batch is irrelevant',
  },
  {
    attack: 'Sandwich',
    icon: Ban,
    reason: 'No individual execution — all intents settle at the same price',
  },
  {
    attack: 'Information leakage',
    icon: Eye,
    reason: 'Encrypted intents hide contents from the block proposer',
  },
  {
    attack: 'JIT liquidity',
    icon: Coins,
    reason: 'Liquidity must be committed before the batch is computed',
  },
  {
    attack: 'Proposer extraction',
    icon: ShieldCheck,
    reason: 'Solver competition ensures surplus flows to users, not validators',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Three-phase pipeline steps                                                 */
/* -------------------------------------------------------------------------- */

const PHASES = [
  {
    phase: 'A',
    title: 'Immediate Execution',
    description:
      'Transfers, staking, contract calls, pool creation, liquidity operations, and limit orders execute sequentially in deterministic order.',
    types: 'Types 0–9, 11–14, 19–20',
    color: 'text-text-secondary',
    bgColor: 'bg-surface',
    borderColor: 'border-border',
  },
  {
    phase: 'B',
    title: 'Batch Auction',
    description:
      'Swap intents are grouped by trading pair. Encrypted intents are threshold-decrypted. Solvers compete to find the optimal uniform clearing price P*.',
    types: 'Types 10 + 18 (intents)',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
  },
  {
    phase: 'C',
    title: 'Settlement',
    description:
      'All fills execute at the clearing price. AMM reserves adjust, limit orders update, solver rewards pay out, and TWAP oracle records the price — atomically.',
    types: 'Atomic state commit',
    color: 'text-buy',
    bgColor: 'bg-buy/10',
    borderColor: 'border-buy/30',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Home page                                                                  */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const { blockHeight, isConnected: isNetworkConnected } = useNetworkStore();
  const { pools } = usePools();

  const topPools = [...pools]
    .sort((a, b) => {
      const ra = BigInt(a.reserve0) + BigInt(a.reserve1);
      const rb = BigInt(b.reserve0) + BigInt(b.reserve1);
      return rb > ra ? 1 : rb < ra ? -1 : 0;
    })
    .slice(0, 5);

  return (
    <div className="relative overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/*  Animated background gradient                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh]"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, hsla(33, 95%, 50%, 0.07) 0%, transparent 60%)',
          }}
        />
        <motion.div
          className="absolute top-20 left-1/3 w-96 h-96 rounded-full"
          style={{
            background:
              'radial-gradient(circle, hsla(33, 80%, 45%, 0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -20, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-1/4 w-72 h-72 rounded-full"
          style={{
            background:
              'radial-gradient(circle, hsla(20, 70%, 40%, 0.04) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 15, -25, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Hero section                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight"
            style={{
              background:
                'linear-gradient(135deg, hsl(33, 95%, 55%) 0%, hsl(20, 90%, 45%) 50%, hsl(33, 95%, 50%) 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'heroShimmer 4s ease-in-out infinite',
            }}
          >
            Caldera
          </h1>
        </motion.div>

        <motion.p
          className="mt-4 text-xl sm:text-2xl font-medium text-text-primary"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Trade on Basalt
        </motion.p>

        <motion.p
          className="mt-3 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          A protocol-native decentralized exchange embedded directly into the
          Basalt execution layer. Not a smart contract — a first-class protocol
          feature, on par with transfers and staking.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <Button asChild size="lg">
            <Link href="/swap">
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pools">View Pools</Link>
          </Button>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Live metrics bar                                                    */}
      {/* ------------------------------------------------------------------ */}
      <FadeInSection className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-wrap items-center justify-center gap-8 rounded-xl border border-border bg-surface/60 backdrop-blur-md px-8 py-5">
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-accent" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider">
              Block
            </span>
            <motion.span
              key={blockHeight}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-sm font-medium text-text-primary tabular-nums"
            >
              #{blockHeight.toLocaleString()}
            </motion.span>
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider">
              Pools
            </span>
            <motion.span
              key={pools.length}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-sm font-medium text-text-primary tabular-nums"
            >
              {pools.length}
            </motion.span>
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider">
              Network
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isNetworkConnected ? 'bg-buy animate-pulse' : 'bg-sell'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  isNetworkConnected ? 'text-buy' : 'text-sell'
                }`}
              >
                {isNetworkConnected ? 'Live' : 'Offline'}
              </span>
            </span>
          </div>
        </div>
      </FadeInSection>

      {/* ------------------------------------------------------------------ */}
      {/*  Protocol-native callout                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <FadeInSection>
          <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/[0.03] backdrop-blur-sm p-8 sm:p-10">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at top left, hsla(33, 95%, 50%, 0.06) 0%, transparent 50%)',
              }}
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                Why Protocol-Native?
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
                Not a smart contract. A protocol feature.
              </h2>
              <p className="text-text-secondary leading-relaxed max-w-3xl">
                Unlike smart-contract-based DEXes that inherit the host chain{"'"}s
                limitations — reentrancy risks, contract dispatch overhead, gas
                inefficiency — Caldera Fusion operates at the execution layer
                itself. All DEX state lives in the Merkle trie with full proof
                support, RocksDB persistence, and fork-merge atomicity. Direct
                state access means no contract dispatch, no ABI encoding, no
                intermediaries.
              </p>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Merkle Proofs', value: 'Built-in' },
                  { label: 'Persistence', value: 'RocksDB' },
                  { label: 'Atomicity', value: 'Fork-merge' },
                  { label: 'Dispatch', value: 'Zero-cost' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg bg-surface/80 border border-border px-3 py-2.5"
                  >
                    <p className="text-xs text-text-tertiary">{item.label}</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Feature cards (6)                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <FadeInSection>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
              Core Features
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Six pillars of Caldera Fusion
            </h2>
          </div>
        </FadeInSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <FadeInSection key={feature.title} delay={index * 0.08}>
              <div className="group relative rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-6 h-full transition-shadow duration-300 hover:shadow-[0_0_24px_hsla(33,95%,50%,0.12)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-3">
                  {feature.description}
                </p>
                <p className="text-[11px] text-text-tertiary italic">
                  Inspired by {feature.inspiration}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Three-phase block production                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <FadeInSection>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
              How It Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Three-phase block production
            </h2>
            <p className="text-text-secondary mt-2 max-w-2xl mx-auto">
              Every block follows a deterministic pipeline: immediate operations
              first, then batch auction for swap intents, then atomic settlement.
            </p>
          </div>
        </FadeInSection>

        {/* Phase cards with connecting flow line */}
        <div className="relative">
          {/* Horizontal connector line (desktop only) */}
          <div className="hidden sm:block absolute top-[2.75rem] left-[calc(33.333%/2)] right-[calc(33.333%/2)] h-px bg-gradient-to-r from-text-tertiary/40 via-accent/50 to-buy/40 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PHASES.map((step, index) => (
              <FadeInSection key={step.phase} delay={index * 0.12}>
                <div
                  className={`relative rounded-xl border ${step.borderColor} bg-surface/80 p-6 h-full flex flex-col`}
                >
                  {/* Phase badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`relative z-10 inline-flex items-center justify-center w-11 h-11 rounded-xl ${step.bgColor} border ${step.borderColor}`}
                    >
                      <span className={`text-lg font-bold ${step.color}`}>
                        {step.phase}
                      </span>
                    </div>
                    {/* Mobile arrow between cards */}
                    {index < PHASES.length - 1 && (
                      <div className="sm:hidden ml-auto">
                        <ArrowRight className="w-4 h-4 text-text-tertiary rotate-90" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1">
                    {step.description}
                  </p>
                  <p className="text-[11px] font-mono text-text-tertiary mt-3 pt-3 border-t border-border">
                    {step.types}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  MEV protection                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20">
        <FadeInSection>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
              MEV Elimination
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Every MEV vector, structurally eliminated
            </h2>
            <p className="text-text-secondary mt-2 max-w-2xl mx-auto">
              The batch auction design doesn{"'"}t just mitigate MEV — it makes
              the primary attack vectors impossible by construction.
            </p>
          </div>
        </FadeInSection>

        <div className="space-y-3">
          {MEV_ATTACKS.map((item, index) => (
            <FadeInSection key={item.attack} delay={index * 0.06}>
              <div className="flex items-start gap-4 rounded-xl border border-border bg-surface/80 px-5 py-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sell/10 shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-sell" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    {item.attack}
                  </h4>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {item.reason}
                  </p>
                </div>
                <div className="ml-auto shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-buy bg-buy/10 px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    Blocked
                  </span>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Top pools section                                                   */}
      {/* ------------------------------------------------------------------ */}
      {topPools.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20">
          <FadeInSection>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Top Pools
              </h2>
              <Link
                href="/pools"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
              >
                View All Pools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeInSection>

          <div className="space-y-3">
            {topPools.map((pool, index) => (
              <FadeInSection key={pool.poolId} delay={index * 0.06}>
                <Link
                  href={`/pools/${pool.poolId}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface/80 backdrop-blur-sm px-5 py-4 hover:bg-surface-hover/60 hover:shadow-[0_0_16px_hsla(33,95%,50%,0.06)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      <TokenIcon address={pool.token0} size="md" />
                      <TokenIcon address={pool.token1} size="md" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
                        <span>{truncateAddress(pool.token0, 6, 4)}</span>
                        <span className="text-text-tertiary">/</span>
                        <span>{truncateAddress(pool.token1, 6, 4)}</span>
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {pool.feeBps / 100}% fee
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-text-primary tabular-nums">
                      {formatTokenAmount(
                        (
                          BigInt(pool.reserve0) + BigInt(pool.reserve1)
                        ).toString(),
                      )}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      Total Reserves
                    </p>
                  </div>
                </Link>
              </FadeInSection>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  CTA section                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-24">
        <FadeInSection>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-10 text-center">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, hsla(33, 95%, 50%, 0.05) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold text-text-primary mb-3">
                Start Trading
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Connect your wallet and make your first swap on the Caldera
                decentralized exchange — forged on volcanic bedrock.
              </p>
              <Button asChild size="lg">
                <Link href="/swap">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </FadeInSection>
      </section>
    </div>
  );
}
