"use client";

import { mockMarkets, mockPositions, mockBalance } from "@/lib/mock-markets";
import { MarketCard } from "@/components/MarketCard";
import Link from "next/link";
import { PriceTicker } from "@/components/PriceTicker";
import { NewsCarousel } from "@/components/NewsCarousel";
import { NewsSidebar } from "@/components/NewsSidebar";
import { useState, useRef, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { useAccount } from "wagmi";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"markets" | "portfolio">("markets");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { address } = useAccount();
  const trending = mockMarkets.slice(0, 3);
  const marketsRef = useRef<HTMLDivElement>(null);

  // Load real transactions
  useEffect(() => {
    if (!address) return;
    const loadTxns = () => {
      const key = `pulse_txns_${address}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
    };
    loadTxns();
    window.addEventListener("storage", loadTxns);
    return () => window.removeEventListener("storage", loadTxns);
  }, [address]);

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
    <div className="text-stone-900 font-sans">
      {/* Price Ticker */}
      <PriceTicker />

      <main className="px-4 py-6 pb-24 max-w-7xl mx-auto">
        {/* News & Insights Section */}
        <section id="market-intelligence-section" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-semibold text-stone-900">Market Intelligence</h2>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-widest">Dispatch 02.07.26</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* Carousel (Left on Desktop) */}
            <div className="min-w-0"> {/* min-w-0 prevents grid blowout with absolute children */}
              <NewsCarousel />
            </div>

            {/* Sidebar (Right on Desktop) */}
            <div className="lg:h-[500px] xl:h-[580px]">
              <NewsSidebar />
            </div>
          </div>
        </section>

        {/* Action Tabs - Content Switchers (Sticky) */}
        <section id="action-tabs-section" className="sticky top-[48px] z-10 grid grid-cols-2 border border-stone-200 mb-8 bg-white shadow-sm">
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
            id="portfolio-tab-button"
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
                {trending.map((market, index) => (
                  <div key={market.id} id={index === 0 ? "market-card-0" : undefined}>
                    <MarketCard market={market} />
                  </div>
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

              {/* Added: Market Insights for more height and value */}
              <div className="bg-[#0C4A6E] text-white p-5 mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest mb-3 opacity-80">Portfolio Insights</h3>
                <p className="text-sm font-serif italic mb-3 leading-relaxed">
                  "Your crypto-heavy exposure is currently 12% higher than the market average. Consider diversifying into politics or sports to hedge against volatility."
                </p>
                <div className="w-full bg-white/20 h-1 mt-4">
                  <div className="bg-sky-400 h-1 w-[65%]"></div>
                </div>
                <p className="text-[10px] mt-2 opacity-60 uppercase tracking-tighter">Diversification Score: 65/100</p>
              </div>

              <div className="space-y-3 mb-8">
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

              {/* Real Recent Activity */}
              <div className="space-y-3">
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest px-1">Recent Activity</p>
                {transactions.length === 0 ? (
                  <p className="text-xs text-stone-400 italic px-1">No recent transactions</p>
                ) : (
                  transactions.slice(0, 3).map((tx, idx) => (
                    <div key={idx} className={`bg-white border border-stone-200 p-4 flex justify-between items-center ${tx.status === 'pending' ? 'animate-pulse border-[#0C4A6E]' : ''}`}>
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold ${
                            tx.status === 'pending' ? 'bg-stone-100 text-stone-400' :
                            tx.type === 'buy' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#0C4A6E]'
                          }`}>
                            {tx.status === 'pending' ? '...' : tx.type === 'buy' ? 'IN' : 'TX'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-stone-900 capitalize">
                              {tx.status === 'pending' ? 'Pending ' : ''}{tx.type} {tx.side || ''}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                       </div>
                       <div className="text-right">
                         <p className="text-xs font-semibold text-stone-900 tabular-nums">
                           {tx.type === 'buy' ? '-' : '+'}${tx.amount}
                         </p>
                         {tx.status === 'pending' && (
                           <p className="text-[10px] text-[#0C4A6E] font-medium animate-pulse">Processing...</p>
                         )}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

