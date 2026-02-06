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
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Navbar / Header */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          Pulse
        </h1>
        <WalletButton />
      </nav>

      {/* Price Ticker */}
      <PriceTicker />

      <main className="px-4 py-5 pb-24">
        {/* News Carousel */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Latest News</h2>
            <span className="text-xs font-medium text-gray-400">Swipe or tap</span>
          </div>
          <NewsCarousel />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/market/list"
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trade Now
          </Link>
          <Link
            href="/portfolio"
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-gray-700 font-bold rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Portfolio
          </Link>
        </div>

        {/* Hot Markets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Hot Markets</h2>
            <Link
              href="/market/list"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-col">
            {trending.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
