"use client";

import { mockPositions, mockBalance } from "@/lib/mock-markets";
import { UsdcBadge } from "@/components/UsdcBadge";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

export default function PortfolioPage() {
  const totalPnl = mockPositions.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
        <WalletButton />
      </div>

      <div className="px-4 py-4">
        {/* P&L Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5 shadow-sm">
          <div className="flex justify-between mb-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Position Value</div>
              <div className="text-2xl font-extrabold text-gray-900">
                ${mockBalance.totalPositionValue.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total P&L</div>
              <div className={`text-2xl font-extrabold ${totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Cash: <UsdcBadge amount={mockBalance.usdc} />
          </div>
        </div>

        {/* Active Positions */}
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Active Positions
        </h2>

        {mockPositions.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No active positions</p>
            <Link href="/market/list" className="text-blue-600 font-semibold">
              Browse markets
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {mockPositions.map((pos) => (
              <div
                key={pos.marketId}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      pos.side === "YES"
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-red-600 bg-red-50"
                    }`}
                  >
                    {pos.side}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      pos.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                  </span>
                </div>
                <Link
                  href={`/market/detail/${pos.marketId}`}
                  className="text-sm font-semibold text-gray-900 leading-snug block mb-2"
                >
                  {pos.question}
                </Link>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{pos.shares} shares @ {pos.avgPrice}¢</span>
                  <span>Now: {pos.currentPrice}¢</span>
                </div>
                {pos.redeemable && (
                  <button className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-colors">
                    Redeem
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
