import Link from "next/link";
import { Market } from "@/lib/types";

export function MarketCard({ market }: { market: Market }) {
  const categoryConfig = {
    sports: { label: "Sports", bg: "bg-orange-100", text: "text-orange-700" },
    crypto: { label: "Crypto", bg: "bg-violet-100", text: "text-violet-700" },
    "pop-culture": { label: "Culture", bg: "bg-pink-100", text: "text-pink-700" },
    politics: { label: "Politics", bg: "bg-blue-100", text: "text-blue-700" },
  };

  const cat = categoryConfig[market.category] || categoryConfig.politics;

  return (
    <Link
      href={`/market/detail/${market.id}`}
      className="block bg-white rounded-xl p-4 mb-3 shadow-sm hover:shadow-md active:shadow-sm border border-gray-100 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
    >
      {/* Category Badge + Volume */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${cat.bg} ${cat.text}`}
        >
          {cat.label}
        </span>
        <span className="text-xs font-medium text-gray-400">
          ${(market.volume / 1000).toFixed(0)}k vol
        </span>
      </div>

      {/* Question */}
      <h3 className="text-base font-semibold text-gray-900 leading-snug mb-4 line-clamp-2">
        {market.question}
      </h3>

      {/* Odds Buttons */}
      <div className="flex gap-3">
        {/* YES */}
        <button className="flex-1 py-3 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-lg text-white font-bold shadow-sm hover:shadow-md hover:from-emerald-500 hover:to-emerald-600 active:shadow-sm transition-all duration-150">
          <span className="text-xl">{market.yesPrice}¢</span>
          <span className="block text-[10px] font-semibold opacity-80 mt-0.5">
            YES
          </span>
        </button>

        {/* NO */}
        <button className="flex-1 py-3 bg-gradient-to-b from-red-400 to-red-500 rounded-lg text-white font-bold shadow-sm hover:shadow-md hover:from-red-500 hover:to-red-600 active:shadow-sm transition-all duration-150">
          <span className="text-xl">{market.noPrice}¢</span>
          <span className="block text-[10px] font-semibold opacity-80 mt-0.5">
            NO
          </span>
        </button>
      </div>
    </Link>
  );
}
