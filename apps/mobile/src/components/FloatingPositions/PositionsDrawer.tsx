"use client";

import { useEffect, useRef } from "react";
import { PositionCard } from "./PositionCard";
import Link from "next/link";
import type { Address } from "viem";

interface Position {
  marketId: string;
  marketAddress: Address;
  question: string;
  side: "YES" | "NO";
  shares: string;
  sharesRaw: bigint;
  yesTokenAddress?: Address;
  noTokenAddress?: Address;
}

interface PositionsDrawerProps {
  visible: boolean;
  positions: Position[];
  isLoading: boolean;
  address: Address;
  onClose: () => void;
  onRefresh: () => void;
}

export function PositionsDrawer({
  visible,
  positions,
  isLoading,
  address,
  onClose,
  onRefresh,
}: PositionsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  // Handle swipe down to close
  useEffect(() => {
    if (!visible) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;
      if (diff > 0) {
        drawer.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleTouchEnd = () => {
      const diff = currentY.current - startY.current;
      if (diff > 100) {
        onClose();
      }
      drawer.style.transform = "";
      startY.current = 0;
      currentY.current = 0;
    };

    drawer.addEventListener("touchstart", handleTouchStart);
    drawer.addEventListener("touchmove", handleTouchMove);
    drawer.addEventListener("touchend", handleTouchEnd);

    return () => {
      drawer.removeEventListener("touchstart", handleTouchStart);
      drawer.removeEventListener("touchmove", handleTouchMove);
      drawer.removeEventListener("touchend", handleTouchEnd);
    };
  }, [visible, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  const totalValue = positions.reduce((sum, p) => {
    return sum + parseFloat(p.shares) * 0.5;
  }, 0);

  const yesPositions = positions.filter((p) => p.side === "YES");
  const noPositions = positions.filter((p) => p.side === "NO");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] animate-fade-in"
        onClick={onClose}
        aria-label="Close positions drawer"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Your positions"
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-[110] bg-white rounded-t-2xl md:rounded-2xl md:bottom-auto md:top-1/2 md:-translate-y-1/2 shadow-2xl animate-slide-up md:animate-fade-in-scale"
        style={{ maxHeight: "85vh" }}
      >
        {/* Swipe handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Positions</h2>
            <p className="text-sm text-gray-500">
              {positions.length} open &middot; ~${totalValue.toFixed(2)} value
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close positions"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: "calc(85vh - 100px)" }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">No Open Positions</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start trading to build your portfolio
              </p>
              <Link
                href="/market/list"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Browse Markets
              </Link>
            </div>
          ) : (
            <>
              {/* Position type summary */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-emerald-600">LONG (YES)</p>
                  <p className="text-lg font-bold text-emerald-700">{yesPositions.length}</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-red-600">SHORT (NO)</p>
                  <p className="text-lg font-bold text-red-700">{noPositions.length}</p>
                </div>
              </div>

              {/* Position cards */}
              <div className="flex flex-col gap-3">
                {positions.map((pos, idx) => (
                  <PositionCard
                    key={`${pos.marketId}-${pos.side}-${idx}`}
                    marketId={pos.marketId}
                    marketAddress={pos.marketAddress}
                    question={pos.question}
                    side={pos.side}
                    shares={pos.shares}
                    sharesRaw={pos.sharesRaw}
                    yesTokenAddress={pos.yesTokenAddress}
                    noTokenAddress={pos.noTokenAddress}
                    address={address}
                    onSellSuccess={onRefresh}
                  />
                ))}
              </div>

              {/* Footer link */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <Link
                  href="/portfolio"
                  onClick={onClose}
                  className="text-sm text-blue-600 font-semibold hover:underline"
                >
                  View Full Portfolio
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
