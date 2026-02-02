"use client";

import { Suspense, useState } from "react";
import { mockMarkets } from "@/lib/mock-markets";
import { MarketCard } from "@/components/MarketCard";
import { WalletButton } from "@/components/WalletButton";
import { useSearchParams } from "next/navigation";

const categories = [
  { key: "all", label: "All" },
  { key: "sports", label: "Sports" },
  { key: "pop-culture", label: "Pop Culture" },
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
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Markets</h1>
        <WalletButton />
      </div>

      <div className="px-4 py-4">
        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Market List */}
        <div className="flex flex-col gap-2">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-400 text-center mt-8 text-sm">
              No markets in this category yet.
            </p>
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
        <div className="p-8 text-center text-gray-400">Loading markets...</div>
      }
    >
      <MarketListContent />
    </Suspense>
  );
}
