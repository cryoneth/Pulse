# Pulse - Build Status & Feasibility Report

## Critical Finding: LI.FI Does NOT Support Testnets

**LI.FI explicitly does not support any testnets** — not Base Sepolia, not Arc Testnet, not Ethereum Sepolia. This is documented at [Testing your integration](https://docs.li.fi/li.fi-api/li.fi-api/requesting-a-quote/testing-your-integration). Their reasoning: limited liquidity, maintenance issues, and cost-effectiveness of mainnet testing on cheap chains.

Additionally, **Arc Testnet is not a supported LI.FI chain** (neither mainnet nor testnet). Arc is mentioned in LI.FI's "State of Interop 2026" report as an emerging chain but is not integrated.

This fundamentally changes the architecture.

---

## Revised Chain Strategy

### What works together

| Tool | Arc Testnet | Base Sepolia | Mainnet (Base, Polygon, etc.) |
|------|------------|-------------|-------------------------------|
| **LI.FI Composer** | NO | NO | YES |
| **Circle Gateway** | YES | YES | YES (mainnet) |
| **Circle Wallets** | YES | YES | YES |
| **Circle Faucet (testnet USDC)** | YES | YES | N/A |
| **Contract deployment** | YES | YES | YES |

### Recommended approach: Split the demo into two execution environments

**For the LI.FI prize** — use **mainnets only**. LI.FI recommends Polygon and Gnosis for cheap testing. The cross-chain flow would be:
- Source: Polygon (or Gnosis, Arbitrum, etc.)
- Destination: Base (mainnet)
- Flow: swap + bridge + contract call via Composer (`getContractCallsQuote`)

**For the Arc/Circle prize** — use **Arc Testnet** as the hub chain:
- Deploy MarketFactory + Market on Arc Testnet
- Use Circle Gateway (Arc Testnet ↔ Base Sepolia supported)
- Use Circle Wallets for "Quick Start" mode
- Demonstrate USDC routing through Arc

**Why this works for both prizes:**
- LI.FI judges see a working Composer flow on real chains with real routing
- Arc/Circle judges see Arc Testnet as the liquidity hub with Gateway + Wallets
- Both share the same frontend and contract logic — just different chain configs

### Alternative: Fake/simulate LI.FI on testnet (risky)

You could hardcode a LI.FI-like flow on testnets (manual bridge + swap + call) and claim it "would use LI.FI in production." This is **not recommended** — LI.FI judges want a working `getContractCallsQuote` integration they can click through. A simulated flow won't qualify.

---

## Arc Testnet Details (Confirmed)

| Property | Value |
|----------|-------|
| Chain ID | `5042002` |
| RPC URL | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Native gas token | USDC |
| USDC contract | `0x3600000000000000000000000000000000000000` |
| Faucet | https://faucet.circle.com (20 USDC per 2 hours) |
| Circle Gateway domain | Supported (testnet) |
| EVM compatible | Yes (Solidity, Hardhat, Foundry all work) |

**Note:** ChainList entry 1244 is "Archie Chain" (deprecated), NOT Circle's Arc. The correct chain ID is `5042002`.

---

## What's Built vs. What's Missing

### DONE (ready to use)

| Component | Status | Notes |
|-----------|--------|-------|
| **Next.js PWA shell** | Done | Pages: `/`, `/market/list`, `/market/detail/[id]`, `/portfolio`, `/fund` |
| **Mobile UI** | Done | Bottom nav, responsive layout, market cards, trading UI |
| **Wagmi config** | Done | Arc Testnet (5042002) + Base Sepolia + WalletConnect configured |
| **Market.sol** | Done | `buy(amount, buyYes)`, `resolve(outcome)`, `redeem()` |
| **MarketFactory.sol** | Done | `createMarket()`, `resolveMarket()`, `getMarkets()` |
| **YesToken / NoToken** | Done | ERC20 + Burnable + Ownable share tokens |
| **MockERC20** | Done | For local/testnet USDC |
| **Hardhat config** | Done | Base Sepolia + Arc Testnet networks |
| **Deploy script** | Done | Auto-detects network, uses real USDC on Base Sepolia |
| **Express API** | Done | `/health`, `/markets`, `/markets/:id`, `/markets/:id/bet` |
| **Mock data** | Done | 8 markets across sports, pop culture, crypto |

### NOT DONE (must build)

| Component | Priority | Effort | Details |
|-----------|----------|--------|---------|
| **LI.FI Composer integration** | P0 (LI.FI prize) | Medium | `getContractCallsQuote` → execute route. Needs mainnet deployment. |
| **Contract deployment (mainnet)** | P0 (LI.FI prize) | Low | Deploy MarketFactory + Market to Base mainnet (or Polygon). Small USDC amounts. |
| **Contract deployment (Arc Testnet)** | P0 (Arc prize) | Low | Run existing deploy script against Arc Testnet. |
| **Circle Gateway endpoints** | P0 (Arc prize) | Medium | `GET /circle/gateway/info`, `POST /circle/gateway/mint`. Server-side calls to Circle API. |
| **Circle Wallets endpoints** | P1 (Arc prize) | Medium | `POST /circle/wallets/create`, `GET /circle/wallets/:id/balances`. |
| **`/hub` page** | P0 (Arc prize) | Medium | "Arc as liquidity hub" view showing Gateway info + route USDC action. |
| **`/debug` page** | P2 (helpful) | Low | Show tx hashes, route status, API responses. |
| **Wire contract calls to UI** | P0 | Medium | Replace demo alerts in market detail with actual wagmi `writeContract` calls. |
| **Architecture diagram** | P0 (Arc prize) | Low | Required by Arc track. Current `docs/architecture-diagram.png` is 813 bytes (likely placeholder). |
| **Demo script** | P1 | Low | `docs/demo-script.md` is empty. |

### CONTRACT CHANGES NEEDED

The current contract interface uses `buy(amount, buyYes)` but the spec calls for `buyYes(marketId, amountUSDC)` and `buyNo(marketId, amountUSDC)`. For the LI.FI Composer flow, the contract function that LI.FI calls needs to:

1. Accept USDC via `transferFrom` (LI.FI executor will be `msg.sender`, not the user)
2. Have separate `buyYes` / `buyNo` entry points (easier for Composer callData encoding)
3. Credit the position to a specified `recipient` address (not `msg.sender`)

**This is important**: LI.FI's executor contract calls your contract, so `msg.sender` will be the LI.FI executor, not the user. You need a `buyYes(uint256 amount, address recipient)` pattern.

---

## LI.FI Composer Implementation Plan

### SDK setup
```
npm install @lifi/sdk
```

### Key function: `getContractCallsQuote`

Parameters needed:
- `fromChain`: source chain ID (e.g., Polygon 137)
- `fromToken`: source token address (e.g., USDC on Polygon)
- `fromAddress`: user's wallet address
- `toChain`: destination chain ID (e.g., Base 8453)
- `toToken`: USDC on destination chain
- `toAmount`: amount needed for the bet
- `contractCalls`: array of contract call objects:
  - `fromAmount`: USDC amount for the contract
  - `fromTokenAddress`: USDC on destination
  - `toContractAddress`: Market contract address
  - `toContractCallData`: encoded `buyYes(amount, recipient)` call
  - `toContractGasLimit`: estimated gas
- `fallbackAddress`: user's address (receives tokens if call fails)

### Flow in the frontend
1. User taps "Confirm Position" on market detail
2. Check user's USDC balance on destination chain
3. If sufficient: direct `writeContract` call
4. If insufficient or user is on wrong chain: call `getContractCallsQuote`
5. Execute the returned route via LI.FI SDK `executeRoute`
6. Monitor status via SDK events / `getStatus` polling
7. Show success screen

### Documentation
- [Cross-Chain Contract Calls API](https://docs.li.fi/li.fi-api/li.fi-api/requesting-a-quote/cross-chain-contract-calls)
- [SDK Overview](https://docs.li.fi/sdk/overview)
- [End-to-End Example](https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example)

---

## Circle Gateway Implementation Plan

### Endpoints to build (apps/api)

**GET /circle/gateway/info**
- Call Circle Gateway API to return supported domains/chains
- Shows Arc Testnet as a supported destination
- Displays in `/hub` page

**POST /circle/gateway/mint**
- Demonstrate cross-chain USDC movement via Gateway
- Source: Base Sepolia → Destination: Arc Testnet
- Uses Circle's Gateway API (server-side, requires API key)

### Gateway API basics
- Base URL (testnet): `https://gateway-api-testnet.circle.com`
- Auth: Bearer token with Circle API key
- Gateway is permissionless for reads, signature-based for transfers
- Docs: https://developers.circle.com/gateway

### Circle Wallets Implementation

**POST /circle/wallets/create**
- Create a developer-controlled wallet on Arc Testnet
- Returns wallet ID + address
- Used for "Quick Start" demo mode

**GET /circle/wallets/:id/balances**
- Return USDC balance for a Circle wallet
- Docs: https://developers.circle.com/wallets

---

## Deployment Checklist

### For Arc prize (testnet)
- [ ] Get testnet USDC from https://faucet.circle.com (select Arc Testnet)
- [ ] Deploy contracts to Arc Testnet: `npx hardhat run scripts/deploy.ts --network arcTestnet`
- [ ] Record deployed addresses
- [ ] Get Circle API key from https://console.circle.com/signup
- [ ] Implement Gateway + Wallets API endpoints
- [ ] Build `/hub` page
- [ ] Create architecture diagram

### For LI.FI prize (mainnet)
- [ ] Deploy contracts to Base mainnet (or Polygon)
- [ ] Modify Market contract to accept `recipient` parameter (for LI.FI executor)
- [ ] Get small amount of real USDC for testing
- [ ] Register LI.FI integrator ID at https://docs.li.fi
- [ ] Implement `getContractCallsQuote` flow in market detail page
- [ ] Test with small amounts (Polygon has ~$0.01 tx fees)
- [ ] Add mainnet chain config to wagmi

### For both
- [ ] Wire wagmi `writeContract` to actual Market contract (replace demo alerts)
- [ ] Add loading states during LI.FI route execution
- [ ] Record 2-3 minute demo video (mobile viewport)
- [ ] Fill out `docs/demo-script.md`
- [ ] Update `docs/architecture-diagram.png` with real diagram
- [ ] Update README with deployed addresses and explanations

---

## Route Structure Summary

```
                    LI.FI PRIZE FLOW (mainnet)
                    ─────────────────────────
User (Polygon USDC) ──→ LI.FI Composer ──→ Base mainnet Market contract
                         swap + bridge       buyYes(amount, recipient)
                         + approve + call


                    ARC/CIRCLE PRIZE FLOW (testnet)
                    ────────────────────────────────
User (Base Sepolia) ──→ Circle Gateway ──→ Arc Testnet Market contract
                         USDC transfer       buyYes(amount)

Circle Wallet ──→ Arc Testnet (Quick Start demo)

/hub page shows: Gateway info, supported domains, route USDC action
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| LI.FI doesn't route to Base mainnet contract calls | High | Test `getContractCallsQuote` early. Polygon as fallback destination. |
| Arc Testnet instability (Circle warns about this) | Medium | Have Base Sepolia as fallback for contract deployment. |
| Real USDC needed for LI.FI mainnet demo | Medium | Use Polygon (cheapest fees). Only need ~$5-10 total. |
| Circle API key approval delay | Medium | Sign up at console.circle.com immediately. |
| Contract `msg.sender` issue with LI.FI | High | Must add `recipient` parameter to buy functions before LI.FI integration. |

---

## Environment Variables Needed

### apps/mobile/.env
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<get from cloud.walletconnect.com>
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_LIFI_INTEGRATOR_ID=<get from LI.FI>

# Mainnet contract addresses (for LI.FI flow)
NEXT_PUBLIC_MARKET_FACTORY_BASE=<deployed address>
NEXT_PUBLIC_MARKET_ADDRESS_BASE=<deployed address>

# Testnet contract addresses (for Arc flow)
NEXT_PUBLIC_MARKET_FACTORY_ARC=<deployed address>
NEXT_PUBLIC_MARKET_ADDRESS_ARC=<deployed address>
```

### apps/api/.env
```
CIRCLE_API_KEY=<get from console.circle.com>
CIRCLE_ENV=testnet
GATEWAY_BASE_URL=https://gateway-api-testnet.circle.com
WALLETS_BASE_URL=https://api.circle.com/v1/w3s
LIFI_API_BASE=https://li.quest/v1
PORT=3001
```

### contracts/.env
```
PRIVATE_KEY=<deployer private key>
```

---

## Hackathon Prize Alignment

### LI.FI - "Best Use of LI.FI Composer in DeFi" ($2,500)

| Requirement | Status | Plan |
|-------------|--------|------|
| Use LI.FI SDK/API for cross-chain action | NOT DONE | Implement `getContractCallsQuote` for swap+bridge+contract call |
| Support 2+ EVM chains | PARTIAL | Source: Polygon/Arbitrum → Destination: Base (mainnet) |
| Working frontend judges can click | PARTIAL | UI exists, needs LI.FI wiring |
| GitHub repo + video demo | NOT DONE | Record after integration |

### Arc - "Best Chain Abstracted USDC Apps Using Arc as a Liquidity Hub" ($5,000)

| Requirement | Status | Plan |
|-------------|--------|------|
| Functional MVP | PARTIAL | Core app works, needs Arc deployment + Circle integration |
| Architecture diagram | PLACEHOLDER | Create real diagram showing Arc hub role |
| Video demo + presentation | NOT DONE | Record after integration |
| Circle tools: Arc, Gateway, USDC, Wallets | NOT DONE | Implement Gateway + Wallets API, deploy to Arc Testnet |
| Product feedback | NOT DONE | Write feedback on Circle developer experience |

---

## Suggested Build Order

1. **Fix contract interface** — add `recipient` param to `buy` functions
2. **Deploy to Arc Testnet** — validates contract + chain work together
3. **Wire frontend to real contracts** — replace mock alerts with wagmi calls
4. **Circle API integration** — Gateway + Wallets endpoints in Express API
5. **Build `/hub` page** — Arc liquidity hub view
6. **Deploy to Base mainnet** — for LI.FI demo (small real USDC)
7. **LI.FI Composer integration** — `getContractCallsQuote` in market detail
8. **Loading states + error handling** — polish for demo
9. **Architecture diagram** — real diagram for `/docs`
10. **Demo video** — 2-3 minutes, mobile viewport
