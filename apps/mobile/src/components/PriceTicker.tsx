"use client";

import { useEffect, useState } from "react";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

// Fetch real prices from CoinGecko (free, no API key needed)
async function fetchPrices(): Promise<Asset[]> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,dogecoin&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 60 } }
    );
    const data = await res.json();

    return [
      { symbol: "BTC", name: "Bitcoin", price: data.bitcoin?.usd || 0, change24h: data.bitcoin?.usd_24h_change || 0 },
      { symbol: "ETH", name: "Ethereum", price: data.ethereum?.usd || 0, change24h: data.ethereum?.usd_24h_change || 0 },
      { symbol: "SOL", name: "Solana", price: data.solana?.usd || 0, change24h: data.solana?.usd_24h_change || 0 },
      { symbol: "XRP", name: "Ripple", price: data.ripple?.usd || 0, change24h: data.ripple?.usd_24h_change || 0 },
      { symbol: "DOGE", name: "Dogecoin", price: data.dogecoin?.usd || 0, change24h: data.dogecoin?.usd_24h_change || 0 },
    ];
  } catch {
    // Fallback mock data
    return [
      { symbol: "BTC", name: "Bitcoin", price: 97842.50, change24h: 2.34 },
      { symbol: "ETH", name: "Ethereum", price: 3421.80, change24h: -1.25 },
      { symbol: "SOL", name: "Solana", price: 198.45, change24h: 5.67 },
      { symbol: "XRP", name: "Ripple", price: 2.84, change24h: 0.89 },
      { symbol: "DOGE", name: "Dogecoin", price: 0.324, change24h: -2.15 },
    ];
  }
}

export function PriceTicker() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrices().then((data) => {
      setAssets(data);
      setLoading(false);
    });

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetchPrices().then(setAssets);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-2 bg-stone-900 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-12 h-4 bg-stone-700" />
            <div className="w-16 h-4 bg-stone-700" />
          </div>
        ))}
      </div>
    );
  }

  // Duplicate for seamless loop
  const duplicatedAssets = [...assets, ...assets];

  return (
    <div className="relative overflow-hidden bg-stone-900 py-2">
      <div className="flex animate-ticker whitespace-nowrap">
        {duplicatedAssets.map((asset, i) => (
          <div
            key={`${asset.symbol}-${i}`}
            className="flex items-center gap-2 px-4 border-r border-stone-700 last:border-0"
          >
            <span className="text-xs font-semibold text-white">{asset.symbol}</span>
            <span className="text-xs font-medium text-stone-300 tabular-nums">
              ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-[10px] font-semibold tabular-nums ${
                asset.change24h >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {asset.change24h >= 0 ? "+" : ""}
              {asset.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
