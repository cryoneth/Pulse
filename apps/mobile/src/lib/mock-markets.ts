import { Market, Position, UserBalance } from "./types";

export const mockMarkets: Market[] = [
  {
    id: "1",
    question: "Will the Lakers win the 2025 NBA Championship?",
    category: "sports",
    yesPrice: 32,
    noPrice: 68,
    volume: 125400,
    endDate: "2025-06-20",
    resolved: false,
  },
  {
    id: "2",
    question: "Will Taylor Swift announce a new album before July?",
    category: "pop-culture",
    yesPrice: 71,
    noPrice: 29,
    volume: 89200,
    endDate: "2025-07-01",
    resolved: false,
  },
  {
    id: "3",
    question: "Will Bitcoin hit $150k in 2025?",
    category: "crypto",
    yesPrice: 45,
    noPrice: 55,
    volume: 342100,
    endDate: "2025-12-31",
    resolved: false,
  },
  {
    id: "4",
    question: "Will the Super Bowl LIX have over 120M viewers?",
    category: "sports",
    yesPrice: 58,
    noPrice: 42,
    volume: 67800,
    endDate: "2025-02-10",
    resolved: false,
  },
  {
    id: "5",
    question: "Will a Marvel movie gross $1B+ in 2025?",
    category: "pop-culture",
    yesPrice: 63,
    noPrice: 37,
    volume: 45600,
    endDate: "2025-12-31",
    resolved: false,
  },
  {
    id: "6",
    question: "Will Ethereum flip Bitcoin in market cap this year?",
    category: "crypto",
    yesPrice: 8,
    noPrice: 92,
    volume: 210300,
    endDate: "2025-12-31",
    resolved: false,
  },
  {
    id: "7",
    question: "Will Drake release a new album in Q1 2025?",
    category: "pop-culture",
    yesPrice: 24,
    noPrice: 76,
    volume: 33100,
    endDate: "2025-03-31",
    resolved: false,
  },
  {
    id: "8",
    question: "Will the Warriors make the NBA playoffs?",
    category: "sports",
    yesPrice: 55,
    noPrice: 45,
    volume: 78900,
    endDate: "2025-04-15",
    resolved: false,
  },
];

export const mockPositions: Position[] = [
  {
    marketId: "1",
    question: "Will the Lakers win the 2025 NBA Championship?",
    side: "YES",
    shares: 50,
    avgPrice: 28,
    currentPrice: 32,
    pnl: 2.0,
    redeemable: false,
  },
  {
    marketId: "3",
    question: "Will Bitcoin hit $150k in 2025?",
    side: "NO",
    shares: 100,
    avgPrice: 60,
    currentPrice: 55,
    pnl: 5.0,
    redeemable: false,
  },
  {
    marketId: "2",
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
