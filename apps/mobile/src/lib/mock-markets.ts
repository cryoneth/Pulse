import { Market, Position, UserBalance } from "./types";

// Deployed on Base mainnet - MarketFactory: 0x1fDA358281A7Fc439Ac81a92bD8CE0db295799B9
export const mockMarkets: Market[] = [
  {
    id: "0x3168dE8A8Ab282E49c57C4bB76dE248fc3e21F91",
    question: "Will the Lakers win the 2025 NBA Championship?",
    category: "sports",
    yesPrice: 32,
    noPrice: 68,
    volume: 125400,
    endDate: "2026-05-07",
    resolved: false,
  },
  {
    id: "0x7518E4cE5cdb58BAF1B8d9fA522eA55bBbC6778A",
    question: "Will Taylor Swift announce a new album before July?",
    category: "pop-culture",
    yesPrice: 71,
    noPrice: 29,
    volume: 89200,
    endDate: "2026-05-07",
    resolved: false,
  },
  {
    id: "0xd93a5aED206ED4646abb679BAd3501950F8bB586",
    question: "Will Bitcoin hit $150k in 2025?",
    category: "crypto",
    yesPrice: 45,
    noPrice: 55,
    volume: 342100,
    endDate: "2026-05-07",
    resolved: false,
  },
  {
    id: "0x16747bE9872068dD2CadF5b841E138B0f6759F11",
    question: "Will the Super Bowl LIX have over 120M viewers?",
    category: "sports",
    yesPrice: 58,
    noPrice: 42,
    volume: 67800,
    endDate: "2026-03-08",
    resolved: false,
  },
  {
    id: "0x1C84Eb5969c6d883f3Ef164eabCE5e1A5Dde9f03",
    question: "Will a Marvel movie gross $1B+ in 2025?",
    category: "pop-culture",
    yesPrice: 63,
    noPrice: 37,
    volume: 45600,
    endDate: "2026-05-07",
    resolved: false,
  },
  {
    id: "0xa7a0740Ba217ccA0a5E97c2ce8437Fc06aF765f5",
    question: "Will Ethereum flip Bitcoin in market cap this year?",
    category: "crypto",
    yesPrice: 8,
    noPrice: 92,
    volume: 210300,
    endDate: "2026-05-07",
    resolved: false,
  },
  {
    id: "0xc4611A7B15bA2747d8732D1D78fD328e4862d5c1",
    question: "Will Drake release a new album in Q1 2025?",
    category: "pop-culture",
    yesPrice: 24,
    noPrice: 76,
    volume: 33100,
    endDate: "2026-02-20",
    resolved: false,
  },
  {
    id: "0xB03dA120855bCFe6fE0f8a6353bA2fda6eA13955",
    question: "Will the Warriors make the NBA playoffs?",
    category: "sports",
    yesPrice: 55,
    noPrice: 45,
    volume: 78900,
    endDate: "2026-03-08",
    resolved: false,
  },
];

export const mockPositions: Position[] = [
  {
    marketId: "0x3168dE8A8Ab282E49c57C4bB76dE248fc3e21F91",
    question: "Will the Lakers win the 2025 NBA Championship?",
    side: "YES",
    shares: 50,
    avgPrice: 28,
    currentPrice: 32,
    pnl: 2.0,
    redeemable: false,
  },
  {
    marketId: "0xd93a5aED206ED4646abb679BAd3501950F8bB586",
    question: "Will Bitcoin hit $150k in 2025?",
    side: "NO",
    shares: 100,
    avgPrice: 60,
    currentPrice: 55,
    pnl: 5.0,
    redeemable: false,
  },
  {
    marketId: "0x7518E4cE5cdb58BAF1B8d9fA522eA55bBbC6778A",
    question: "Will Taylor Swift announce a new album before July?",
    side: "YES",
    shares: 30,
    avgPrice: 65,
    currentPrice: 71,
    pnl: 1.8,
    redeemable: false,
  },
];

export const mockBalance: UserBalance = {
  usdc: 247.5,
  totalPositionValue: 132.3,
};

export function getMarketById(id: string): Market | undefined {
  return mockMarkets.find((m) => m.id === id);
}

export function getMarketsByCategory(category: string): Market[] {
  if (category === "all") return mockMarkets;
  return mockMarkets.filter((m) => m.category === category);
}
