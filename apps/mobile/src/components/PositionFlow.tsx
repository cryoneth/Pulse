"use client";

import { useState, useCallback } from "react";
import { StepTracker } from "./StepTracker";
import type { PositionStep } from "@/lib/lifi";

type FlowState = "confirming" | "executing" | "success" | "error";

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
}: PositionFlowProps) {
  if (!visible) return null;

  const isExecuting = flowState === "executing";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={isExecuting ? undefined : onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 mb-4 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {flowState === "success"
              ? "Position Live"
              : flowState === "error"
              ? "Something went wrong"
              : "Confirm Position"}
          </h2>
          {!isExecuting && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 min-h-0">
          {/* Quote summary — shown in confirming/executing */}
          {(flowState === "confirming" || flowState === "executing") && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Paying
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {amountUSDC} {sourceTokenName} on {sourceChainName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Receiving
                </span>
                <span
                  className={`text-sm font-bold ${
                    side === "YES" ? "text-emerald-600" : "text-red-600"
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-5">
              <div className="text-center">
                <div className="text-3xl mb-2">&#10003;</div>
                <h3 className="text-lg font-bold text-emerald-700 mb-1">
                  Position Live
                </h3>
                {marketQuestion && (
                  <p className="text-sm text-gray-600 mb-2">{marketQuestion}</p>
                )}
                <p className="text-sm text-emerald-600 font-semibold">
                  {side} &middot; {amountUSDC} USDC
                </p>
                {successTxHash && (
                  <a
                    href={`https://basescan.org/tx/${successTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 underline mt-2 inline-block"
                  >
                    View on BaseScan
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {flowState === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
              <p className="text-sm text-red-700 font-semibold text-center">
                {errorMessage || "An error occurred"}
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                Your funds are never stranded. If anything fails, tokens stay in
                your wallet.
              </p>
            </div>
          )}
        </div>

        {/* Fixed footer with CTA — always visible */}
        <div className="shrink-0 px-5 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] border-t border-gray-100 bg-white rounded-b-none">
          {flowState === "confirming" && (
            <div>
              <button
                onClick={onConfirm}
                className={`w-full py-3.5 rounded-lg text-white font-bold text-base mb-2 ${
                  side === "YES"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Confirm Position
              </button>
              <p className="text-xs text-gray-400 text-center">
                Your funds are never stranded. If anything fails, tokens stay in
                your wallet.
              </p>
            </div>
          )}

          {flowState === "executing" && (
            <div className="flex items-center justify-center py-2">
              <span className="text-sm text-gray-500 font-medium">
                Processing...
              </span>
            </div>
          )}

          {flowState === "error" && (
            <div className="flex gap-3">
              {errorRecoverable && (
                <button
                  onClick={onRetry}
                  className="flex-1 py-3 rounded-lg bg-gray-900 text-white font-bold text-sm"
                >
                  Retry same route
                </button>
              )}
              <button
                onClick={onRequote}
                className={`${
                  errorRecoverable ? "flex-1" : "w-full"
                } py-3 rounded-lg bg-blue-600 text-white font-bold text-sm`}
              >
                Re-quote best route
              </button>
            </div>
          )}

          {flowState === "success" && (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-lg bg-gray-900 text-white font-bold text-base"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </>
  );
}
