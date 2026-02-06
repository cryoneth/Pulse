"use client";

import { Suspense, useState } from "react";
import { mockMarkets } from "@/lib/mock-markets";
import { MarketCard } from "@/components/MarketCard";
import { WalletButton } from "@/components/WalletButton";
import { useSearchParams } from "next/navigation";

const categories = [
  { key: "all", label: "All" },
  { key: "sports", label: "Sports" },
  { key: "pop-culture", label: "Culture" },
  { key: "crypto", label: "Crypto" },
];

function MarketListContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || "all";
  const [activeCategory, setActiveCategory] = useState(initialCat);

  const filtered =
    activeCategory === "all"
      ? mockMarkets
      : mockMarkets.filter((m) => m.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-stone-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-serif font-semibold text-[#0C4A6E]">Markets</h1>
        <WalletButton />
      </div>

      <div className="px-4 py-6 pb-24">
        {/* Category Filter - Editorial Tab Style */}
        <div className="flex border border-stone-200 mb-6">
          {categories.map((cat, idx) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                idx > 0 ? "border-l border-stone-200" : ""
              } ${
                activeCategory === cat.key
                  ? "bg-[#0C4A6E] text-white"
                  : "bg-white text-stone-500 hover:bg-stone-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-2">
          <h2 className="text-sm font-serif font-semibold text-stone-900 uppercase tracking-tight">
            Available Markets
          </h2>
          <span className="text-[10px] font-medium text-stone-400 tabular-nums">
            {filtered.length} listings
          </span>
        </div>

        {/* Market List */}
        <div className="flex flex-col">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white border border-stone-200">
              <p className="text-stone-400 font-serif text-lg mb-4">No markets found in this section.</p>
              <button
                onClick={() => setActiveCategory("all")}
                className="text-[#0C4A6E] text-sm font-semibold hover:underline"
              >
                Show all markets →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-[#0C4A6E] animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-500 font-serif">Updating index...</p>
          </div>
        </div>
      }
    >
      <MarketListContent />
    </Suspense>
  );
}
