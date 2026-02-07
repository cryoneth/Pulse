import Link from "next/link";
import { Market } from "@/lib/types";

export function MarketCard({ market }: { market: Market }) {
  // Newspaper style: subtle colored borders, not filled backgrounds
  const categoryConfig = {
    sports: { label: "Sports", border: "border-orange-300", text: "text-orange-700" },
    crypto: { label: "Crypto", border: "border-violet-300", text: "text-violet-700" },
    "pop-culture": { label: "Culture", border: "border-pink-300", text: "text-pink-700" },
    politics: { label: "Politics", border: "border-sky-300", text: "text-sky-700" },
  };

  const cat = categoryConfig[market.category] || categoryConfig.politics;

  return (
    <Link
      href={`/market/detail/${market.id}`}
      className="block bg-white border border-stone-200 p-6 mb-4 hover:border-stone-300 transition-colors duration-200"
    >
      {/* Category Badge + Volume */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 bg-white border ${cat.border} ${cat.text}`}
        >
          {cat.label}
        </span>
        <span className="text-xs font-medium text-stone-400 tabular-nums">
          ${(market.volume / 1000).toFixed(0)}k vol
        </span>
      </div>

      {/* Question - Editorial serif headline */}
      <h3 className="text-lg font-serif font-semibold text-stone-900 leading-snug mb-5 line-clamp-2">
        {market.question}
      </h3>

      {/* Odds Buttons - Outlined style, equal weight */}
      <div className="flex gap-3">
        {/* YES */}
        <button className="flex-1 py-3 bg-white border-2 border-green-600 text-green-600 font-medium hover:bg-green-50 transition-colors duration-200">
          <span className="text-lg tabular-nums">{market.yesPrice}¢</span>
          <span className="block text-[10px] font-medium uppercase tracking-wide mt-0.5">
            Yes
          </span>
        </button>

        {/* NO */}
        <button className="flex-1 py-3 bg-white border-2 border-red-600 text-red-600 font-medium hover:bg-red-50 transition-colors duration-200">
          <span className="text-lg tabular-nums">{market.noPrice}¢</span>
          <span className="block text-[10px] font-medium uppercase tracking-wide mt-0.5">
            No
          </span>
        </button>
      </div>
    </Link>
  );
}
