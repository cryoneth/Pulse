import { Router, Request, Response } from "express";

interface Market {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate: string;
  resolved: boolean;
  outcome?: boolean;
}

const markets: Market[] = [
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

const router = Router();

// GET /markets - list all markets, optionally filter by category
router.get("/", (req: Request, res: Response) => {
  const { category } = req.query;
  if (category && typeof category === "string") {
    const filtered = markets.filter((m) => m.category === category);
    res.json({ markets: filtered });
    return;
  }
  res.json({ markets });
});

// GET /markets/:id - market detail
router.get("/:id", (req: Request, res: Response) => {
  const market = markets.find((m) => m.id === req.params.id);
  if (!market) {
    res.status(404).json({ error: "Market not found" });
    return;
  }
  res.json({ market });
});

// POST /markets/:id/bet - place a bet (mock)
router.post("/:id/bet", (req: Request, res: Response) => {
  const market = markets.find((m) => m.id === req.params.id);
  if (!market) {
    res.status(404).json({ error: "Market not found" });
    return;
  }

  const { side, amount } = req.body;
  if (!side || !amount) {
    res.status(400).json({ error: "side and amount are required" });
    return;
  }
  if (side !== "YES" && side !== "NO") {
    res.status(400).json({ error: "side must be YES or NO" });
    return;
  }

  const price = side === "YES" ? market.yesPrice : market.noPrice;
  const shares = amount / (price / 100);

  res.json({
    success: true,
    bet: {
      marketId: market.id,
      side,
      amount,
      shares: parseFloat(shares.toFixed(2)),
      price,
    },
  });
});

export default router;
