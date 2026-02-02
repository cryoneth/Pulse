import Link from "next/link";
import { Market } from "@/lib/types";

export function MarketCard({ market }: { market: Market }) {
  // Simple category icons
  const catIcon = market.category === 'sports' ? '⚽' : 
                  market.category === 'crypto' ? '₿' : 
                  market.category === 'pop-culture' ? '🎤' : '🌐';

  return (
    <Link 
      href={`/market/detail/${market.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-3 mb-2 active:bg-gray-50 transition-colors"
    >
      <div className="flex gap-3">
        {/* Left: Icon & Info */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{catIcon}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {market.category}
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                    ${(market.volume / 1000).toFixed(1)}k
                </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 pr-2">
                {market.question}
            </h3>
        </div>

        {/* Right: Action Buttons (Visual representation of odds) */}
        <div className="flex gap-2 items-center min-w-[130px]">
            {/* YES Button */}
            <div className="flex-1 flex flex-col gap-1">
                <button className="w-full py-2 bg-emerald-500 rounded text-white text-xs font-bold shadow-sm border border-emerald-600 active:translate-y-px">
                    {market.yesPrice}%
                </button>
                <div className="text-[9px] text-emerald-600 font-bold text-center uppercase">Yes</div>
            </div>

            {/* NO Button */}
            <div className="flex-1 flex flex-col gap-1">
                <button className="w-full py-2 bg-red-500 rounded text-white text-xs font-bold shadow-sm border border-red-600 active:translate-y-px">
                    {market.noPrice}%
                </button>
                 <div className="text-[9px] text-red-600 font-bold text-center uppercase">No</div>
            </div>
        </div>
      </div>
    </Link>
  );
}