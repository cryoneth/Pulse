export interface Market {
  id: string;
  question: string;
  category: "sports" | "pop-culture" | "crypto" | "politics";
  yesPrice: number; // 0-100, represents cents
  noPrice: number;
  volume: number; // total USDC volume
  endDate: string;
  resolved: boolean;
  outcome?: boolean;
  imageUrl?: string;
}

export interface Position {
  marketId: string;
  question: string;
  side: "YES" | "NO";
  shares: number;
  avgPrice: number; // cents
  currentPrice: number;
  pnl: number;
  redeemable: boolean;
}

export interface UserBalance {
  usdc: number;
  totalPositionValue: number;
}
