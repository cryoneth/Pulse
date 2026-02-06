"use client";

import { mockMarkets } from "@/lib/mock-markets";
import { MarketCard } from "@/components/MarketCard";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { PriceTicker } from "@/components/PriceTicker";
import { NewsCarousel } from "@/components/NewsCarousel";

export default function Home() {
  const trending = mockMarkets.slice(0, 3);

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

        {/* Quick Actions - Flat, clean buttons */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/market/list"
            className="flex items-center justify-center gap-2 px-4 py-4 bg-[#0C4A6E] hover:bg-[#075985] text-white font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trade Now
          </Link>
          <Link
            href="/portfolio"
            className="flex items-center justify-center gap-2 px-4 py-4 bg-white text-stone-700 font-medium border border-stone-200 hover:border-stone-300 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Portfolio
          </Link>
        </section>

        {/* Hot Markets */}
        <section>
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
      </main>
    </div>
  );
}
