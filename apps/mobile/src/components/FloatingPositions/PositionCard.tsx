"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useWriteContract } from "wagmi";
import { parseUnits, type Address } from "viem";
import { ERC20_APPROVE_ABI, SELL_ABI, BASE_CHAIN_ID } from "@/lib/lifi";

interface PositionCardProps {
  marketId: string;
  marketAddress: Address;
  question: string;
  side: "YES" | "NO";
  shares: string;
  sharesRaw: bigint;
  currentPrice: number;
  yesTokenAddress?: Address;
  noTokenAddress?: Address;
  address: Address;
  onSellSuccess: () => void;
}

export function PositionCard({
  marketId,
  marketAddress,
  question,
  side,
  shares,
  currentPrice,
  yesTokenAddress,
  noTokenAddress,
  address,
  onSellSuccess,
}: PositionCardProps) {
  const [sellAmount, setSellAmount] = useState("");
  const [sellState, setSellState] = useState<"idle" | "approving" | "selling" | "success" | "error">("idle");
  const [sellError, setSellError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const sharesNum = parseFloat(shares);
  const estimatedValue = sharesNum * (currentPrice / 100);

  // Save transaction to localStorage for portfolio history
  const saveTransaction = useCallback(
    (txHash: string, type: "sell", side: "YES" | "NO", amount: string) => {
      const key = `pulse_txns_${address}`;
      const existing = localStorage.getItem(key);
      const txns = existing ? JSON.parse(existing) : [];
      txns.unshift({
        hash: txHash,
        type,
        side,
        amount,
        timestamp: Date.now(),
        chainId: BASE_CHAIN_ID,
      });
      localStorage.setItem(key, JSON.stringify(txns.slice(0, 50)));
    },
    [address]
  );

  const handleSell = useCallback(async () => {
    if (!sellAmount || !address) return;
    const sellAmountRaw = parseUnits(sellAmount, 6);
    const tokenAddr = side === "YES" ? yesTokenAddress : noTokenAddress;

    if (!tokenAddr) {
      setSellError("Token address not found");
      setSellState("error");
      return;
    }

    setSellState("approving");
    setSellError("");

    try {
      // Step 1: Approve the market contract to spend the user's share tokens
      await writeContractAsync({
        address: tokenAddr,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [marketAddress, sellAmountRaw],
        chainId: BASE_CHAIN_ID,
      });

      // Step 2: Call sell() on the market contract
      setSellState("selling");
      const sellTxHash = await writeContractAsync({
        address: marketAddress,
        abi: SELL_ABI,
        functionName: "sell",
        args: [sellAmountRaw, side === "YES"],
        chainId: BASE_CHAIN_ID,
      });

      // Save transaction
      saveTransaction(sellTxHash, "sell", side, sellAmount);

      setSellState("success");
      setSellAmount("");

      // Notify parent to refresh positions
      setTimeout(() => {
        onSellSuccess();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sell failed";
      if (msg.includes("rejected") || msg.includes("denied")) {
        setSellError("Transaction cancelled");
      } else {
        setSellError(msg.length > 80 ? msg.slice(0, 80) + "..." : msg);
      }
      setSellState("error");
    }
  }, [sellAmount, address, side, yesTokenAddress, noTokenAddress, marketAddress, writeContractAsync, saveTransaction, onSellSuccess]);

  const sellAmountNum = parseFloat(sellAmount) || 0;
  const isOverMax = sellAmountNum > sharesNum;

  return (
    <div className="bg-white border border-stone-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 uppercase tracking-wider ${
              side === "YES"
                ? "text-green-700 bg-green-50 border border-green-200"
                : "text-red-700 bg-red-50 border border-red-200"
            }`}
          >
            {side}
          </span>
          <div className="text-right">
            <p className="text-sm font-semibold text-stone-900 tabular-nums">
              {sharesNum.toFixed(2)} shares
            </p>
            <p className="text-xs text-stone-500 tabular-nums">
              ~${estimatedValue.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-sm font-serif font-semibold text-stone-900 leading-snug line-clamp-2">
          {question}
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/market/detail/${marketId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-[#0C4A6E] font-semibold hover:underline uppercase tracking-wider"
            >
              View Market
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExpanded) {
                  setSellAmount(shares);
                }
                setIsExpanded(!isExpanded);
              }}
              className="text-xs text-red-600 font-semibold hover:underline uppercase tracking-wider"
            >
              {isExpanded ? "Cancel Sell" : "Sell Position"}
            </button>
          </div>
          <svg
            className={`w-4 h-4 text-stone-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable sell section */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-stone-100 bg-stone-50">
          {sellState === "success" ? (
            <div className="text-center py-3">
              <div className="w-8 h-8 bg-green-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-green-700">Sold successfully!</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Shares to sell
                  </label>
                  <button
                    type="button"
                    onClick={() => setSellAmount(shares)}
                    className="text-xs text-[#0C4A6E] font-semibold hover:text-[#075985]"
                  >
                    Max: {sharesNum.toFixed(2)}
                  </button>
                </div>
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => {
                    setSellAmount(e.target.value);
                    if (sellState === "error") setSellState("idle");
                  }}
                  className="w-full px-3 py-2.5 bg-white border-2 border-stone-200 text-sm font-semibold focus:outline-none focus:border-[#0C4A6E] transition-colors tabular-nums"
                  placeholder="0.00"
                />
                {isOverMax && (
                  <p className="text-xs text-red-600 mt-1">
                    Exceeds available shares
                  </p>
                )}
                {sellAmountNum > 0 && !isOverMax && (
                  <p className="text-xs text-stone-500 mt-1 tabular-nums">
                    Est. return: ~${(sellAmountNum * (currentPrice / 100)).toFixed(2)} USDC
                  </p>
                )}
              </div>

              <button
                onClick={handleSell}
                disabled={
                  !sellAmount ||
                  sellAmountNum <= 0 ||
                  isOverMax ||
                  sellState === "approving" ||
                  sellState === "selling"
                }
                className="w-full py-2.5 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-stone-900 hover:bg-stone-800"
              >
                {sellState === "approving"
                  ? "Approving..."
                  : sellState === "selling"
                  ? "Selling..."
                  : `Sell ${side} for USDC`}
              </button>

              {sellState === "error" && sellError && (
                <p className="text-xs text-red-600 font-medium text-center mt-2">
                  {sellError}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
