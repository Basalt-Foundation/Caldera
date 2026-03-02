# Caldera

Web frontend for the Caldera Fusion decentralized exchange on [Basalt](https://github.com/Basalt-Foundation/basalt). Caldera Fusion is a protocol-native DEX embedded directly in the Basalt execution layer — not a smart contract, but a first-class protocol feature with batch auctions, concentrated liquidity, encrypted intents, and on-chain limit orders.

## Key Features

- **Batch Auction Trading** – Swap intents settle at a uniform clearing price per block, eliminating front-running and sandwich attacks by construction
- **Concentrated Liquidity** – Deploy liquidity within custom price ranges for maximum capital efficiency (Uniswap v3-style tick-based positions)
- **On-Chain Limit Orders** – Persistent limit orders that cross at the batch clearing price alongside AMM liquidity
- **Encrypted Intents** – EC-ElGamal key exchange and AES-256-GCM encryption, threshold-decrypted by validators at settlement
- **Solver Network** – External solvers compete to provide optimal settlement with surplus-based scoring
- **Dynamic Fees** – Volatility-responsive fee curve (1 bps floor, 500 bps cap)
- **Client-Side Signing** – Ed25519 transaction signing via `@noble/ed25519`, private keys never leave the browser
- **Real-Time Updates** – WebSocket block stream for live network status and pool data

## Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Framework | Next.js 16 (App Router, Turbopack)                |
| UI        | React 19, Tailwind CSS 4, Radix UI, Framer Motion |
| State     | Zustand (client), SWR (server)                    |
| Charting  | Lightweight Charts                                |
| Crypto    | @noble/ed25519, @noble/hashes                     |
| Testing   | Vitest, React Testing Library, jsdom              |

## Quick Start

### Prerequisites

- Node.js 20+
- A running Basalt node (default: `http://localhost:5100`)

### Run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:3000`. API requests are proxied to the Basalt node via Next.js rewrites to avoid CORS issues.

### Test

```bash
npm test          # watch mode
npm run test:run  # single run
```

### Build

```bash
npm run build
npm start
```

## Configuration

| Variable                     | Default                 | Description                                   |
|------------------------------|-------------------------|-----------------------------------------------|
| `NEXT_PUBLIC_BASALT_API_URL` | `http://localhost:5100` | Basalt node REST API endpoint                 |
| `NEXT_PUBLIC_BASALT_WS_URL`  | `ws://localhost:5100`   | Basalt node WebSocket endpoint (block stream) |

## Pages

| Route         | Description                                                    |
|---------------|----------------------------------------------------------------|
| `/`           | Landing page with live network stats and top pools             |
| `/swap`       | Token swap with slippage settings and price impact display     |
| `/pools`      | Pool listing with search and sorting                           |
| `/pools/[id]` | Pool detail -- reserves, price chart, order book visualization |
| `/liquidity`  | Add/remove liquidity, concentrated range positions             |
| `/orders`     | Limit order placement and order history                        |
| `/portfolio`  | Wallet balances, LP positions, transaction history             |
| `/analytics`  | TVL chart, volume chart, top pools table                       |
| `/faucet`     | Devnet token faucet                                            |
| `/tx/[hash]`  | Transaction detail and receipt                                 |

## Project Structure

```
src/
├── app/                    Next.js App Router pages
├── components/
│   ├── analytics/          TVL, volume, top pools
│   ├── layout/             Header, Footer, NetworkBadge
│   ├── liquidity/          Add/remove liquidity, concentrated range
│   ├── orders/             Order form, order tables
│   ├── pool-detail/        Price chart, order book, reserves
│   ├── pools/              Pool table, search, row
│   ├── portfolio/          Balances, LP positions, tx history
│   ├── shared/             Button, Card, Modal, AmountInput, Skeleton
│   ├── swap/               SwapCard, settings, confirmation, token selector
│   └── wallet/             WalletButton, WalletModal
├── hooks/                  SWR data hooks (usePools, useAccount, useOrders, ...)
├── lib/
│   ├── api/                REST client with retry/backoff, endpoint modules
│   ├── crypto/             Ed25519 signing, encrypted keystore
│   ├── dex/                AMM math (getAmountOut, getAmountIn, price impact)
│   ├── format/             Address truncation, token amount formatting
│   ├── tx/                 Transaction builder, binary encoder, signer, UInt256
│   ├── types/              TypeScript interfaces (API responses, DEX types)
│   └── ws/                 WebSocket block stream client
└── stores/                 Zustand stores (wallet, network, swap, settings)
```

## Status

Caldera is functional for core trading operations (swap, liquidity, limit orders, portfolio). The following areas are under active development or planned.

### Known Gaps

- [ ] **Encrypted swap UI** – Backend supports `DexEncryptedSwapIntent` (type 18) but the frontend only builds regular swap intents
- [ ] **Order history** – Filled/cancelled orders not yet fetched from the node; history tab uses an empty stub
- [ ] **Solver dashboard** – API client exists (`lib/api/solvers.ts`) but no page renders solver or pending intent data
- [ ] **Pool creation** – No frontend interface; pools can only be created via CLI or direct API calls
- [ ] **Token registry** – Only BSLT and WBSLT are known; other tokens display as truncated addresses
- [ ] **Volume & fee analytics** – Charts show current reserves only; 24h volume, APY, and fee tracking require an indexer
- [ ] **Price chart fallback** – Pools with no price history show a synthetic flat line at spot price
- [ ] **Settings page** – Slippage and deadline are stored in Zustand but have no dedicated settings UI
- [ ] **Emergency pause indicator** – No banner when the DEX is paused by governance
- [ ] **Rate limiting (429)** – The Basalt API currently runs on validator nodes; under load the frontend may hit 429 responses until standalone RPC nodes are available

### Roadmap

- [ ] Dark/light theme toggle (currently dark-only)
- [ ] Encrypted intent toggle on the swap page with privacy indicator
- [ ] Solver leaderboard and intent lifecycle visualization
- [ ] Depth chart and interactive order book on pool detail pages
- [ ] LP position management in portfolio (collect fees, remove liquidity, tick range visualization)
- [ ] TWAP oracle overlay on price charts
- [ ] Transaction history filters (by type, token pair, status) and CSV export
- [ ] On-chain governance voting and proposal submission
- [ ] Mnemonic / keystore JSON import, hardware wallet support
- [ ] Internationalization (i18n)
- [ ] Standalone RPC node (dissociate API from validator nodes to eliminate rate limiting)

## Related

- [Basalt](https://github.com/Basalt-Foundation/basalt) – Basalt blockchain source code
- [Documentation](https://basalt-foundation.github.io/basalt-docs/) – Technical documentation
- [Bridge Contracts](https://github.com/Basalt-Foundation/basalt-contracts) – Solidity bridge contracts

## License

Copyright © 2025-2026 Basalt Foundation
