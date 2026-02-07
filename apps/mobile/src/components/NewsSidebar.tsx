"use client";

import { mockMarkets } from "@/lib/mock-markets";
import Link from "next/link";

export function NewsSidebar() {
  const topMovers = mockMarkets.slice(0, 3); // Just taking the first 3 for the mock

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4 lg:h-full">
      {/* 1. Pulse Sentiment */}
      <div className="bg-white border border-stone-200 p-4 flex flex-col justify-between min-h-[160px] lg:h-full">
        <div>
          <h3 className="text-[10px] font-medium uppercase tracking-widest text-stone-500 mb-2">Pulse Sentiment</h3>
          <p className="text-sm font-serif font-semibold text-stone-900 leading-tight">
            Market confidence in ETH Stage 2 scaling hits 2nd-year high.
          </p>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-medium text-stone-400 mb-1 uppercase tracking-tighter">
            <span>Bearish</span>
            <span>Bullish</span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 relative">
            <div 
              className="absolute top-0 left-0 h-full bg-[#0C4A6E] transition-all duration-1000" 
              style={{ width: "68%" }}
            />
          </div>
          <p className="text-[10px] mt-2 text-[#0C4A6E] font-bold">68% SIGNAL</p>
        </div>
      </div>

      {/* 2. Breaking Insights */}
      <div className="bg-[#0C4A6E] text-white p-4 flex flex-col justify-between min-h-[160px] lg:h-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
            <h3 className="text-[10px] font-medium uppercase tracking-widest text-sky-200">The Scoop</h3>
          </div>
          <p className="text-sm font-serif italic leading-relaxed text-white">
            "Insiders suggest a major USDC liquidity injection on Base is scheduled for late tonight, potentially shifting L2 volume norms."
          </p>
        </div>
        <p className="text-[10px] mt-3 text-sky-300 font-medium uppercase tracking-tighter">— Financial Intel Bureau</p>
      </div>

      {/* 3. Top Movers */}
      <div className="bg-white border border-stone-200 p-4 flex flex-col justify-between min-h-[160px] lg:h-full">
        <h3 className="text-[10px] font-medium uppercase tracking-widest text-stone-500 mb-3">Top Movers (1h)</h3>
        <div className="space-y-3">
          {topMovers.map((market) => (
            <Link key={market.id} href={`/market/detail/${market.id}`} className="flex items-center justify-between group">
              <span className="text-xs font-serif font-medium text-stone-600 group-hover:text-[#0C4A6E] transition-colors line-clamp-1 flex-1">
                {market.question}
              </span>
              <span className="text-[10px] font-bold tabular-nums text-green-600 ml-2">
                +{Math.floor(Math.random() * 5) + 2}.{(Math.random() * 99).toFixed(0)}%
              </span>
            </Link>
          ))}
        </div>
        <Link href="/market/list" className="text-[10px] font-bold text-[#0C4A6E] uppercase tracking-widest mt-4 hover:underline">
          Full Board →
        </Link>
      </div>
    </div>
  );
}
