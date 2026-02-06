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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Markets</h1>
        <WalletButton />
      </div>

      <div className="px-4 py-4 pb-24">
        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.key
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs font-medium text-gray-400 mb-4">
          {filtered.length} market{filtered.length !== 1 ? "s" : ""} available
        </p>

        {/* Market List */}
        <div className="flex flex-col">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-2">No markets in this category yet.</p>
              <button
                onClick={() => setActiveCategory("all")}
                className="text-blue-600 text-sm font-semibold hover:text-blue-700"
              >
                View all markets
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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading markets...</p>
          </div>
        </div>
      }
    >
      <MarketListContent />
    </Suspense>
  );
}
