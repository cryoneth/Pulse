"use client";

import { useEffect, useState } from "react";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  category?: 'crypto' | 'stock' | 'commodity' | 'index';
}

// Fetch real crypto prices and mix with traditional assets
async function fetchPrices(): Promise<Asset[]> {
  let cryptoAssets: Asset[] = [];
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,dogecoin&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 60 } }
    );
    const data = await res.json();

    cryptoAssets = [
      { symbol: "BTC", name: "Bitcoin", price: data.bitcoin?.usd || 97842.50, change24h: data.bitcoin?.usd_24h_change || 2.34, category: 'crypto' },
      { symbol: "ETH", name: "Ethereum", price: data.ethereum?.usd || 3421.80, change24h: data.ethereum?.usd_24h_change || -1.25, category: 'crypto' },
      { symbol: "SOL", name: "Solana", price: data.solana?.usd || 198.45, change24h: data.solana?.usd_24h_change || 5.67, category: 'crypto' },
    ];
  } catch {
    cryptoAssets = [
      { symbol: "BTC", name: "Bitcoin", price: 97842.50, change24h: 2.34, category: 'crypto' },
      { symbol: "ETH", name: "Ethereum", price: 3421.80, change24h: -1.25, category: 'crypto' },
      { symbol: "SOL", name: "Solana", price: 198.45, change24h: 5.67, category: 'crypto' },
    ];
  }

  const traditionalAssets: Asset[] = [
    { symbol: "GOLD", name: "Gold", price: 2642.15, change24h: 0.45, category: 'commodity' },
    { symbol: "SPX", name: "S&P 500", price: 5982.10, change24h: 0.12, category: 'index' },
    { symbol: "META", name: "Meta", price: 584.20, change24h: 1.85, category: 'stock' },
    { symbol: "AAPL", name: "Apple", price: 232.15, change24h: -0.42, category: 'stock' },
    { symbol: "GOOGL", name: "Google", price: 184.30, change24h: 0.75, category: 'stock' },
    { symbol: "TSLA", name: "Tesla", price: 342.10, change24h: -2.45, category: 'stock' },
  ];

  // Shuffle or mix them in a specific order
  return [
    cryptoAssets[0], // BTC
    traditionalAssets[0], // GOLD
    cryptoAssets[1], // ETH
    traditionalAssets[1], // SPX
    traditionalAssets[2], // META
    cryptoAssets[2], // SOL
    traditionalAssets[3], // AAPL
    traditionalAssets[4], // GOOGL
    traditionalAssets[5], // TSLA
  ];
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
            className="flex items-center gap-3 px-6 border-r border-stone-800 last:border-0"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-white tracking-tight">{asset.symbol}</span>
                {asset.category && (
                  <span className={`text-[8px] px-1 py-0.5 rounded-[2px] font-bold uppercase ${
                    asset.category === 'crypto' ? 'bg-violet-900/50 text-violet-300' :
                    asset.category === 'stock' ? 'bg-blue-900/50 text-blue-300' :
                    asset.category === 'commodity' ? 'bg-amber-900/50 text-amber-300' :
                    'bg-emerald-900/50 text-emerald-300'
                  }`}>
                    {asset.category}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-stone-300 tabular-nums">
                ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`text-[9px] font-bold tabular-nums leading-none ${
                  asset.change24h >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {asset.change24h >= 0 ? "▲" : "▼"}
                {Math.abs(asset.change24h).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
