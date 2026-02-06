"use client";

import { mockMarkets, mockPositions, mockBalance } from "@/lib/mock-markets";
import { MarketCard } from "@/components/MarketCard";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { PriceTicker } from "@/components/PriceTicker";
import { NewsCarousel } from "@/components/NewsCarousel";
import { useState, useRef } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"markets" | "portfolio">("markets");
  const trending = mockMarkets.slice(0, 3);
  const marketsRef = useRef<HTMLDivElement>(null);

  const scrollToMarkets = () => {
    setActiveTab("markets");
    setTimeout(() => {
      marketsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const scrollToPortfolio = () => {
    setActiveTab("portfolio");
    setTimeout(() => {
      marketsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans">
      {/* Navbar / Header - Clean, editorial */}
      <nav className="sticky top-0 z-20 bg-white border-b border-stone-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-serif font-semibold text-[#0C4A6E]">
          Pulse
        </h1>
        <WalletButton />
      </nav>

      {/* Price Ticker */}
      <PriceTicker />

      <main className="px-4 py-6 pb-24">
        {/* News Carousel */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-semibold text-stone-900">Latest News</h2>
            <span className="text-xs font-medium text-stone-400">Swipe or tap</span>
          </div>
          <NewsCarousel />
        </section>

        {/* Action Tabs - Content Switchers (Sticky) */}
        <section className="sticky top-[48px] z-10 grid grid-cols-2 border border-stone-200 mb-8 bg-white shadow-sm">
          <button
            onClick={scrollToMarkets}
            className={`flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all duration-200 ${
              activeTab === "markets"
                ? "bg-[#0C4A6E] text-white"
                : "bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trade Now
          </button>
          <button
            onClick={scrollToPortfolio}
            className={`flex items-center justify-center gap-2 px-4 py-4 font-medium border-l border-stone-200 transition-all duration-200 ${
              activeTab === "portfolio"
                ? "bg-[#0C4A6E] text-white"
                : "bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Portfolio
          </button>
        </section>

        {/* Dynamic Content Section */}
        <div ref={marketsRef} className="scroll-mt-40">
          {activeTab === "markets" ? (
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-semibold text-stone-900">Hot Markets</h2>
                <Link
                  href="/market/list"
                  className="text-sm font-medium text-[#0C4A6E] hover:text-[#075985] transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="flex flex-col">
                {trending.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            </section>
          ) : (
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-semibold text-stone-900">Your Portfolio</h2>
                <Link
                  href="/portfolio"
                  className="text-sm font-medium text-[#0C4A6E] hover:text-[#075985] transition-colors"
                >
                  Full details →
                </Link>
              </div>
              
              {/* Mini Portfolio View */}
              <div className="bg-white border border-stone-200 p-5 mb-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-medium text-stone-500 uppercase tracking-widest mb-1">Total Value</p>
                    <p className="text-2xl font-semibold text-stone-900 tabular-nums">${(mockBalance.usdc + mockBalance.totalPositionValue).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-stone-500 uppercase tracking-widest mb-1">Available</p>
                    <p className="text-lg font-medium text-stone-700 tabular-nums">${mockBalance.usdc.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest px-1">Active Positions</p>
                {mockPositions.map((pos, idx) => (
                  <div key={idx} className="bg-white border border-stone-200 p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-serif font-semibold text-stone-900 line-clamp-1">{pos.question}</p>
                      <p className="text-[10px] font-medium text-stone-500 uppercase mt-1">
                        <span className={pos.side === 'YES' ? 'text-green-600' : 'text-red-600'}>{pos.side}</span> • {pos.shares} shares
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-stone-900 tabular-nums">${(pos.shares * (pos.currentPrice / 100)).toFixed(2)}</p>
                      <p className={`text-[10px] font-medium tabular-nums ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

