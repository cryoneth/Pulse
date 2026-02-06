"use client";

import { useState, useCallback } from "react";
import { StepTracker } from "./StepTracker";
import type { PositionStep } from "@/lib/lifi";

type FlowState = "confirming" | "executing" | "verifying" | "success" | "error";

interface PositionFlowProps {
  visible: boolean;
  side: "YES" | "NO";
  amountUSDC: string;
  sourceChainName: string;
  sourceTokenName: string;
  onClose: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  onRequote: () => void;
  steps: PositionStep[];
  flowState: FlowState;
  errorMessage?: string;
  errorRecoverable?: boolean;
  successTxHash?: string;
  marketQuestion?: string;
  confirmedShares?: string;
}

export function PositionFlow({
  visible,
  side,
  amountUSDC,
  sourceChainName,
  sourceTokenName,
  onClose,
  onConfirm,
  onRetry,
  onRequote,
  steps,
  flowState,
  errorMessage,
  errorRecoverable,
  successTxHash,
  marketQuestion,
  confirmedShares,
}: PositionFlowProps) {
  if (!visible) return null;

  const isExecuting = flowState === "executing" || flowState === "verifying";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={isExecuting ? undefined : onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-stone-200 max-h-[90vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 mb-4 shrink-0">
          <h2 className="text-lg font-serif font-semibold text-stone-900">
            {flowState === "success"
              ? "Position Live"
              : flowState === "error"
              ? "Something went wrong"
              : flowState === "verifying"
              ? "Verifying Position..."
              : "Confirm Position"}
          </h2>
          {!isExecuting && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 text-xl font-bold transition-colors"
            >
              &times;
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 min-h-0">
          {/* Quote summary — shown in confirming/executing */}
          {(flowState === "confirming" || flowState === "executing" || flowState === "verifying") && (
            <div className="bg-stone-50 border border-stone-200 p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Paying
                </span>
                <span className="text-sm font-semibold text-stone-900 tabular-nums">
                  {amountUSDC} {sourceTokenName} on {sourceChainName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Receiving
                </span>
                <span
                  className={`text-sm font-semibold ${
                    side === "YES" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {side} shares on Base
                </span>
              </div>
            </div>
          )}

          {/* Step tracker — shown during executing/success/error */}
          {flowState !== "confirming" && steps.length > 0 && (
            <div className="mb-5">
              <StepTracker steps={steps} />
            </div>
          )}

          {/* Success card */}
          {flowState === "success" && (
            <div className="bg-green-50 border border-green-200 p-4 mb-5">
              <div className="text-center">
                <div className="text-3xl text-green-600 mb-2">&#10003;</div>
                <h3 className="text-lg font-serif font-semibold text-green-700 mb-1">
                  Position Live
                </h3>
                {marketQuestion && (
                  <p className="text-sm text-stone-600 mb-2">{marketQuestion}</p>
                )}
                <p className="text-sm text-green-600 font-semibold tabular-nums">
                  {side} &middot; {amountUSDC} USDC
                </p>
                {confirmedShares && (
                  <p className="text-sm font-semibold text-green-800 mt-1 tabular-nums">
                    {confirmedShares} {side} shares confirmed
                  </p>
                )}
                {successTxHash && (
                  <a
                    href={`https://basescan.org/tx/${successTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0C4A6E] underline mt-2 inline-block"
                  >
                    View on BaseScan
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {flowState === "error" && (
            <div className="bg-red-50 border border-red-200 p-4 mb-5">
              <p className="text-sm text-red-700 font-semibold text-center">
                {errorMessage || "An error occurred"}
              </p>
              <p className="text-xs text-stone-500 text-center mt-2">
                Your funds are never stranded. If anything fails, tokens stay in
                your wallet.
              </p>
            </div>
          )}
        </div>

        {/* Fixed footer with CTA — always visible */}
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-stone-100 bg-white">
          {flowState === "confirming" && (
            <div>
              <button
                onClick={onConfirm}
                className={`w-full py-3.5 text-white font-medium text-base mb-2 transition-colors ${
                  side === "YES"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm Position
              </button>
              <p className="text-xs text-stone-400 text-center">
                Your funds are never stranded. If anything fails, tokens stay in
                your wallet.
              </p>
            </div>
          )}

          {flowState === "executing" && (
            <div className="flex items-center justify-center py-2">
              <span className="text-sm text-stone-500 font-medium">
                Processing...
              </span>
            </div>
          )}

          {flowState === "verifying" && (
            <div className="flex items-center justify-center py-2">
              <span className="text-sm text-[#0C4A6E] font-medium">
                Verifying position on Base...
              </span>
            </div>
          )}

          {flowState === "error" && (
            <div className="flex gap-3">
              {errorRecoverable && (
                <button
                  onClick={onRetry}
                  className="flex-1 py-3 bg-stone-900 text-white font-medium text-sm transition-colors hover:bg-stone-800"
                >
                  Retry same route
                </button>
              )}
              <button
                onClick={onRequote}
                className={`${
                  errorRecoverable ? "flex-1" : "w-full"
                } py-3 bg-[#0C4A6E] hover:bg-[#075985] text-white font-medium text-sm transition-colors`}
              >
                Re-quote best route
              </button>
            </div>
          )}

          {flowState === "success" && (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-stone-900 text-white font-medium text-base transition-colors hover:bg-stone-800"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </>
  );
}
