"use client";

import { mockMarkets, mockBalance } from "@/lib/mock-markets";
import { MarketCard } from "@/components/MarketCard";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

export default function Home() {
  const trending = mockMarkets.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Navbar / Header */}
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Pulse
        </h1>
        <WalletButton />
      </nav>

      <main className="px-4 py-6">
        {/* Balance Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Balance</span>
          </div>
          
          <div className="text-3xl font-bold text-gray-900 mb-6 flex items-baseline gap-2">
            ${mockBalance.usdc.toFixed(2)}
            <span className="text-sm font-normal text-gray-500">USDC</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/fund" className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors">
              + Deposit
            </Link>
            <Link href="/portfolio" className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-50 transition-colors">
              Portfolio
            </Link>
          </div>
        </div>

        {/* Categories / Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {[
              { label: "Trending", href: "/market/list", active: true },
              { label: "Sports", href: "/market/list?cat=sports", active: false },
              { label: "Pop Culture", href: "/market/list?cat=pop-culture", active: false },
              { label: "Crypto", href: "/market/list?cat=crypto", active: false },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    action.active 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Market List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Top Markets</h2>
          <div className="flex flex-col gap-2">
            {trending.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}