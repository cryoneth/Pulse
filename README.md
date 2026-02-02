# Pulse  
Mobile-First Cross-Chain Prediction Markets in USDC

Pulse is a mobile-first prediction market app where users can create and trade on real-world outcomes using **USDC**, with seamless **cross-chain onboarding powered by LI.FI** and **cross-chain settlement powered by Arc (Circle)**.

Built for HackMoney 2026.

---

## What is Pulse?

Pulse allows anyone to participate in prediction markets on sports and pop culture outcomes with a simple flow:

**Deposit from anywhere → USDC → place prediction → settle & redeem**

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
- abstracting cross-chain complexity via **LI.FI**
- routing liquidity and payouts through **Arc as a unified hub**
- designing for **mobile-first usage**

---

## Key Features

### 1. Cross-Chain Onboarding (LI.FI – Primary Target)

Pulse uses **LI.FI Composer** to orchestrate a full cross-chain flow in one action:

**swap → bridge → approve → bet**

Users can start with:
- any supported token
- on any supported EVM chain

LI.FI automatically:
- finds optimal routes
- swaps into USDC
- bridges funds
- executes the contract call to place a prediction

This enables a true **“deposit from anywhere”** experience.

---

### 2. USDC-Native Prediction Markets (Circle)

All markets are:
- denominated in USDC
- settled in USDC
- displayed in dollar terms

This makes the app intuitive for non-DeFi users and suitable for consumer-grade financial use cases.

---

### 3. Cross-Chain Liquidity & Settlement (Arc)

Pulse treats **Arc as a liquidity hub** for prediction markets.

Arc is used to:
- route USDC liquidity where markets are created
- handle conditional payouts once markets resolve
- unify settlement across chains without fragmenting UX

Prediction markets are modeled as **conditional USDC flows**, making Arc a natural fit for routing, settlement, and payouts.

---

### 4. Trust-Minimized Market Resolution

Markets resolve via a dispute-enabled oracle mechanism:
- outcomes are asserted after market close
- a dispute window ensures correctness
- winners redeem USDC once finalized

This avoids centralized operators while keeping the system simple enough for a one-week build.

---

## User Flow

### 1. Open the App
Pulse runs as a **mobile-first web app (PWA)**.
No installation required.

### 2. Add Funds (LI.FI)
- User taps “Add USDC”
- LI.FI Composer handles:
  - swap (token A → USDC)
  - bridge (chain X → chain Y)
  - contract call (deposit + approve)

### 3. Place Prediction
- User selects a market
- Buys YES or NO using USDC
- Position is recorded instantly

### 4. Market Resolution
- After end time, outcome is asserted
- Dispute window opens
- Outcome finalizes on-chain

### 5. Redeem
- Winning positions redeem USDC
- Funds are available immediately

---

## Market Design

- Binary markets only (YES / NO)
- Categories: sports & pop culture (demo-safe)
- No bet limits (hackathon demo)
- Fixed USDC collateral
- Mobile-optimized market views

---

## Smart Contract Architecture

### Core Contracts
- **MarketFactory**
  - Deploys new markets
- **Market**
  - Handles USDC deposits
  - Tracks YES / NO positions
  - Manages redemption
- **Oracle Adapter**
  - Interfaces with the resolution mechanism

### External Integrations
- **USDC (ERC-20)** – settlement currency
- **LI.FI SDK / Composer** – cross-chain execution
- **Arc** – liquidity routing & settlement hub
- **Circle Wallets & Gateway** – account & transaction infrastructure

---

## Why LI.FI?

LI.FI is part of the **core user journey**, not an add-on.

Pulse directly aligns with the LI.FI prize goals by:
- using LI.FI Composer for multi-step DeFi flows
- supporting multiple EVM chains
- delivering a clickable, mobile-first frontend
- abstracting swaps, bridges, and execution into one action

---

## Why Arc?

Prediction markets are conditional financial contracts.

Arc enables Pulse to:
- treat multiple chains as a single liquidity surface
- route USDC efficiently for market settlement
- support cross-chain payouts without degrading UX

Pulse fits the **“Crosschain Financial Apps Using Arc as a Liquidity Hub”** track by design.

---

## Tech Stack

- Frontend: Mobile-first PWA (React)
- Smart Contracts: Solidity (EVM)
- Payments: USDC
- Cross-Chain Execution: LI.FI SDK / Composer
- Liquidity & Settlement: Arc
- Wallets: Any EVM-compatible wallet

---

## Demo Notes

- Demo markets use non-sensitive categories
- Focus is on end-to-end flow, not scale
- Judges can click through the full mobile experience
- Cross-chain funding is demonstrated live or via recorded demo

---

## Hackathon Goals

- Demonstrate how LI.FI enables seamless cross-chain consumer UX
- Show Arc as a practical liquidity hub for conditional financial apps
- Prove prediction markets can be mobile-first and intuitive

---

## Future Features

- Contrarian signals (“bet against the crowd”)
- Market creator staking for quality assurance
- Prediction streaks (non-financial gamification)
- Private / friends-only markets

---

Built for HackMoney 2026.
