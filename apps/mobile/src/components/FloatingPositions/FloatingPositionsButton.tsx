"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits, type Address } from "viem";
import { mockMarkets } from "@/lib/mock-markets";
import { MARKET_TOKEN_ABI, BASE_CHAIN_ID } from "@/lib/lifi";
import { PositionsDrawer } from "./PositionsDrawer";

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

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

// Pages where the FAB should be hidden
const HIDDEN_PATHS = ["/onboarding", "/login", "/settings"];

export function FloatingPositionsButton() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Build contract calls for all markets' YES and NO tokens
  const tokenAddressContracts = mockMarkets.flatMap((market) => [
    {
      address: market.id as Address,
      abi: MARKET_TOKEN_ABI,
      functionName: "yesToken" as const,
      chainId: BASE_CHAIN_ID,
    },
    {
      address: market.id as Address,
      abi: MARKET_TOKEN_ABI,
      functionName: "noToken" as const,
      chainId: BASE_CHAIN_ID,
    },
  ]);

  const { data: tokenAddresses, refetch: refetchTokenAddresses } = useReadContracts({
    contracts: tokenAddressContracts,
  });

  // Once we have token addresses, fetch balances
  const balanceContracts =
    tokenAddresses && address
      ? tokenAddresses
          .filter((r) => r.status === "success" && r.result)
          .map((r) => ({
            address: r.result as Address,
            abi: ERC20_BALANCE_ABI,
            functionName: "balanceOf" as const,
            args: [address] as const,
            chainId: BASE_CHAIN_ID,
          }))
      : [];

  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances } = useReadContracts({
    contracts: balanceContracts,
    query: { enabled: balanceContracts.length > 0 },
  });

  // Process balances into positions
  useEffect(() => {
    if (!tokenAddresses || !balances || !address) {
      setIsLoading(false);
      return;
    }

    const newPositions: Position[] = [];
    let balanceIndex = 0;

    for (let i = 0; i < mockMarkets.length; i++) {
      const market = mockMarkets[i];
      const yesTokenResult = tokenAddresses[i * 2];
      const noTokenResult = tokenAddresses[i * 2 + 1];

      if (yesTokenResult?.status !== "success" || noTokenResult?.status !== "success") {
        continue;
      }

      const yesTokenAddress = yesTokenResult.result as Address;
      const noTokenAddress = noTokenResult.result as Address;

      // Find corresponding balance results
      const yesBalanceResult = balances[balanceIndex];
      const noBalanceResult = balances[balanceIndex + 1];
      balanceIndex += 2;

      if (yesBalanceResult?.status === "success") {
        const yesBalance = yesBalanceResult.result as bigint;
        if (yesBalance > BigInt(0)) {
          newPositions.push({
            marketId: market.id,
            marketAddress: market.id as Address,
            question: market.question,
            side: "YES",
            shares: formatUnits(yesBalance, 6),
            sharesRaw: yesBalance,
            yesTokenAddress,
            noTokenAddress,
          });
        }
      }

      if (noBalanceResult?.status === "success") {
        const noBalance = noBalanceResult.result as bigint;
        if (noBalance > BigInt(0)) {
          newPositions.push({
            marketId: market.id,
            marketAddress: market.id as Address,
            question: market.question,
            side: "NO",
            shares: formatUnits(noBalance, 6),
            sharesRaw: noBalance,
            yesTokenAddress,
            noTokenAddress,
          });
        }
      }
    }

    setPositions(newPositions);
    setIsLoading(false);
  }, [tokenAddresses, balances, address, refreshKey]);

  // Refresh function
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    refetchTokenAddresses();
    refetchBalances();
    setRefreshKey((k) => k + 1);
  }, [refetchTokenAddresses, refetchBalances]);

  // Refresh when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      handleRefresh();
    }
  }, [isDrawerOpen, handleRefresh]);

  // Check if FAB should be hidden
  const isHiddenPath = HIDDEN_PATHS.some((path) => pathname.startsWith(path));

  // Don't render if:
  // - User not connected
  // - On hidden path
  // - No positions (and not loading)
  if (!isConnected || isHiddenPath) {
    return null;
  }

  // While loading initially, show nothing (to prevent flash)
  if (isLoading && positions.length === 0 && !isDrawerOpen) {
    return null;
  }

  // If no positions and done loading, hide FAB
  if (positions.length === 0 && !isLoading && !isDrawerOpen) {
    return null;
  }

  const positionCount = positions.length;
  const displayCount = positionCount > 9 ? "9+" : positionCount.toString();

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        aria-label={`View open positions (${positionCount})`}
        className="fixed bottom-24 right-4 z-[90] w-14 h-14 md:w-15 md:h-15 md:bottom-8 md:right-6 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center group animate-fade-in-scale"
      >
        {/* Portfolio icon */}
        <svg
          className="w-6 h-6 text-white transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>

        {/* Badge */}
        {positionCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md">
            {displayCount}
          </span>
        )}

        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-blue-600/30 animate-ping-slow" />
      </button>

      {/* Positions Drawer */}
      <PositionsDrawer
        visible={isDrawerOpen}
        positions={positions}
        isLoading={isLoading || balancesLoading}
        address={address!}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={handleRefresh}
      />
    </>
  );
}
