"use client";

import { mockMarkets, mockBalance } from "@/lib/mock-markets";
import { MarketCard } from "@/components/MarketCard";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

export default function Home() {
  const trending = mockMarkets.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Navbar / Header */}
      <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          Pulse
        </h1>
        <WalletButton />
      </nav>

      <main className="px-4 py-6 pb-24">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Balance
            </span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              +12.3%
            </span>
          </div>

          <div className="text-4xl font-bold text-white mb-1 tracking-tight">
            ${mockBalance.usdc.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400 mb-6">
            ≈ {mockBalance.usdc.toFixed(2)} USDC
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/fund"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Deposit
            </Link>
            <Link
              href="/portfolio"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all duration-200 border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Portfolio
            </Link>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {[
              { label: "Trending", href: "/market/list", active: true },
              { label: "Sports", href: "/market/list?cat=sports", active: false },
              { label: "Culture", href: "/market/list?cat=pop-culture", active: false },
              { label: "Crypto", href: "/market/list?cat=crypto", active: false },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  action.active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Markets */}
        <div>
          <div className="flex items-center justify-between mb-4">
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
