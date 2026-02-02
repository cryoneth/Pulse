# Pulse
Cross-Chain Prediction Markets Powered by LI.FI Composer

Pulse is a mobile-first prediction market app where users can trade on real-world outcomes using **USDC**, with seamless **cross-chain onboarding powered by LI.FI Composer**.

One click: **swap + bridge + approve + place position** — from any chain.

Built for HackMoney 2026.

---

## What is Pulse?

Pulse allows anyone to participate in prediction markets on sports and pop culture outcomes with a simple flow:

**Pick a market > Choose YES or NO > Confirm from any chain > Position live.**

No volatile tokens.
No chain-switching friction.
No complex DeFi dashboards.

---

## Why Pulse?

Prediction markets are powerful, but adoption is limited by:
- fragmented liquidity across chains
- confusing onboarding and bridges
- poor mobile UX

Pulse solves this by:
- using **USDC as the single unit of account**
- abstracting all cross-chain complexity via **LI.FI Composer**
- designing for **mobile-first usage**

---

## How LI.FI Composer Powers Pulse

LI.FI is the **core of the user journey**, not an add-on.

When a user taps "Confirm Position", LI.FI Composer orchestrates the full cross-chain flow in one action:

```
swap (any token) > bridge (any chain > Base) > approve USDC > buyFor(amount, side, recipient)
```

Users can start with:
- **24 supported tokens** across 7 EVM chains
- USDC, USDT, DAI, ETH, WETH, POL, AVAX, BNB

LI.FI automatically:
- finds the optimal route
- swaps into USDC
- bridges to Base
- executes the smart contract call to place the prediction

The user never leaves the app. No manual bridging, no chain switching.

### Supported Source Chains

| Chain | Tokens |
|-------|--------|
| Base | USDC, ETH, WETH, DAI |
| Polygon | USDC, USDT, POL, WETH |
| Arbitrum | USDC, USDT, ETH, DAI |
| Ethereum | ETH, USDC, USDT, DAI, WETH |
| Optimism | ETH, USDC, USDT |
| Avalanche | AVAX, USDC |
| BSC | BNB, USDT, USDC |

**Destination chain:** Base mainnet (cheapest L2 gas, real USDC liquidity)

---

## Key Features

### 1. One-Click Cross-Chain Positions (LI.FI Composer)

The `openPositionWithLifi` composable handles the entire flow:

```ts
import { openPositionWithLifi } from "@/lib/openPositionWithLifi";

await openPositionWithLifi({
  marketAddress: "0x...",
  side: "YES",
  amountUSDC: "10.00",
  recipient: userAddress,
  fromChainId: 137,           // Polygon
  fromTokenAddress: "0x...",  // USDC on Polygon
  onStep: (steps) => updateUI(steps),
  onComplete: (txHash) => showSuccess(txHash),
  onError: (msg) => showError(msg),
});
```

This is an **embeddable onboarding primitive** — any prediction market UI can plug it in.

### 2. Real-Time Step Tracker

Users see exactly what's happening:

```
[1] Swap & Bridge to Base    ✓ complete   (tx: 0xabc...)
[2] Placing position         ● active
```

Each step shows status (pending / active / complete / error), transaction hash, and explorer link.

### 3. USDC-Native Markets

All markets are:
- denominated in USDC
- settled in USDC
- displayed in dollar terms

This makes the app intuitive for non-DeFi users.

### 4. No-Stranded-Funds Guarantee

If any step fails:
- Tokens stay in the user's wallet
- "Retry same route" or "Re-quote best route" recovery buttons
- Clear error messages for every failure mode

---

## User Flow

1. **Open the app** — mobile-first PWA, no installation
2. **Pick a market** — browse sports, pop culture, crypto markets
3. **Choose YES or NO** — select your position
4. **Select source chain & token** — USDC on Polygon, ETH on Ethereum, etc.
5. **Tap "Confirm Position"** — LI.FI handles swap + bridge + contract call
6. **Watch the step tracker** — real-time progress
7. **Position live** — shares arrive on Base

---

## Smart Contract Architecture

### Contracts (Solidity, deployed on Base)

- **MarketFactory** — deploys new binary prediction markets
- **Market** — handles USDC deposits, YES/NO positions, redemption
  - `buy(amount, buyYes)` — direct purchase (same-chain)
  - `buyFor(amount, buyYes, recipient)` — for LI.FI executor (cross-chain)
  - `resolve(outcome)` — oracle-driven resolution
  - `redeem()` — winners claim USDC
- **YesToken / NoToken** — ERC20 share tokens (burnable)

### The `buyFor` Pattern

LI.FI's executor contract calls `buyFor` on behalf of the user. Since `msg.sender` is the LI.FI executor (not the user), `buyFor` accepts a `recipient` parameter so shares go to the right wallet.

```solidity
function buyFor(uint256 amount, bool buyYes, address recipient) external {
    require(recipient != address(0), "Invalid recipient");
    _buy(amount, buyYes, recipient);
}
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 (mobile-first PWA) |
| Wallet | wagmi v3, WalletConnect, EIP-6963 multi-provider |
| Cross-Chain | LI.FI SDK v3 (Composer, getContractCallsQuote, executeRoute) |
| Smart Contracts | Solidity 0.8.24, Hardhat |
| Settlement | USDC on Base mainnet |
| API | Express.js |

---

## Project Structure

```
apps/
  mobile/          # Next.js PWA
    src/
      lib/
        lifi.ts              # LI.FI SDK wrapper (quote, execute, step tracking)
        openPositionWithLifi.ts  # Composable export for any UI
      components/
        PositionFlow.tsx     # Bottom-sheet execution modal
        StepTracker.tsx      # Real-time step progress UI
        WalletButton.tsx     # Multi-wallet connector
      app/
        market/detail/[id]/  # Market trading page with LI.FI flow
        market/list/         # Market browser
        portfolio/           # User positions
        fund/                # Info page (no separate funding needed)
  api/               # Express API for market data
contracts/
  src/
    Market.sol         # Core prediction market with buyFor
    MarketFactory.sol  # Market deployer
    YesToken.sol       # YES share token
    NoToken.sol        # NO share token
```

---

## Error Handling

| Error | UX |
|-------|----|
| Wallet rejection | "Cancelled" + "Try Again" |
| Route expired | "Quote expired" + "Re-quote" |
| Insufficient balance | Shown before execute |
| Insufficient gas | "Need [TOKEN] for gas" |
| Contract revert | "Position couldn't open. Funds in your wallet on Base." |

---

## Running Locally

```bash
# Install dependencies
cd apps/mobile && npm install

# Set environment variables
cp .env.example .env
# Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

# Start dev server
npm run dev
```

---

## Hackathon Target

**LI.FI — "Best Use of LI.FI Composer in DeFi" ($2,500)**

Pulse directly aligns with the prize goals:
- LI.FI Composer is the **core product mechanism**, not a bolt-on
- Supports **7 EVM chains** and **24 token options**
- Delivers a **clickable, mobile-first frontend** judges can test
- Abstracts swaps, bridges, and contract execution into **one user action**
- Provides a reusable `openPositionWithLifi` composable for any DeFi app

---

Built for HackMoney 2026.
