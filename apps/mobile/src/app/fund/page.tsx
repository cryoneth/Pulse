"use client";

import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

export default function FundPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Funding</h1>
        <WalletButton />
      </div>

      <div className="px-4 py-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 text-2xl text-emerald-600 font-bold">
            &#10003;
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            No separate funding needed
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Buy a position from any chain and we handle the rest. Pulse uses
            LI.FI Composer to swap, bridge, and place your position in one
            transaction.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              How it works
            </div>
            <div className="text-sm text-gray-500 leading-relaxed space-y-2">
              <p>1. Pick a market and choose YES or NO</p>
              <p>2. Select your source chain &amp; token (USDC, ETH, etc.)</p>
              <p>3. Confirm &mdash; LI.FI handles swap + bridge + position</p>
              <p>4. Your shares arrive on Base. Done.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left mb-5">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              Supported source chains
            </div>
            <div className="text-sm text-blue-700 font-semibold">
              Base &middot; Polygon &middot; Arbitrum &middot; Ethereum
            </div>
          </div>

          <Link
            href="/market/list"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
