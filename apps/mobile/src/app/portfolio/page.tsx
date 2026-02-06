"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { useAccount, useReadContracts, useBalance } from "wagmi";
import { formatUnits, type Address } from "viem";
import { mockMarkets } from "@/lib/mock-markets";
import { BASE_CHAIN_ID, BASE_USDC, MARKET_TOKEN_ABI } from "@/lib/lifi";

// Explorer URLs by chain
const EXPLORERS: Record<number, { name: string; url: string }> = {
  1: { name: "Etherscan", url: "https://etherscan.io" },
  8453: { name: "BaseScan", url: "https://basescan.org" },
  42161: { name: "Arbiscan", url: "https://arbiscan.io" },
  56: { name: "BscScan", url: "https://bscscan.com" },
  137: { name: "PolygonScan", url: "https://polygonscan.com" },
  10: { name: "Optimism", url: "https://optimistic.etherscan.io" },
};

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

interface Transaction {
  hash: string;
  type: "buy" | "sell" | "approve";
  market?: string;
  side?: "YES" | "NO";
  amount?: string;
  timestamp: number;
  chainId: number;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "history">("positions");
  const [isLoading, setIsLoading] = useState(true);

  // Get USDC balance on Base
  const { data: usdcBalance } = useReadContracts({
    contracts: address
      ? [
          {
            address: BASE_USDC as Address,
            abi: ERC20_BALANCE_ABI,
            functionName: "balanceOf",
            args: [address],
            chainId: BASE_CHAIN_ID,
          },
        ]
      : [],
  });

  // Get native ETH balance on Base
  const { data: ethBalance } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
  });

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

  const { data: tokenAddresses } = useReadContracts({
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

  const { data: balances, isLoading: balancesLoading } = useReadContracts({
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
  }, [tokenAddresses, balances, address]);

  // Load transaction history from localStorage
  useEffect(() => {
    if (!address) return;
    const stored = localStorage.getItem(`pulse_txns_${address}`);
    if (stored) {
      try {
        setTransactions(JSON.parse(stored));
      } catch {
        // Invalid data
      }
    }
  }, [address]);

  const usdcFormatted =
    usdcBalance?.[0]?.status === "success"
      ? parseFloat(formatUnits(usdcBalance[0].result as bigint, 6)).toFixed(2)
      : "0.00";

  const ethFormatted = ethBalance
    ? parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4)
    : "0.0000";

  const totalPositionValue = positions.reduce((sum, p) => {
    // Estimate value at 50c per share (simplified)
    return sum + parseFloat(p.shares) * 0.5;
  }, 0);

  const getExplorerLink = (chainId: number, hash: string) => {
    const explorer = EXPLORERS[chainId] || EXPLORERS[8453];
    return `${explorer.url}/tx/${hash}`;
  };

  const getAddressExplorerLink = (chainId: number, addr: string) => {
    const explorer = EXPLORERS[chainId] || EXPLORERS[8453];
    return `${explorer.url}/address/${addr}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
          <WalletButton />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Connect your wallet to view your positions and transaction history
          </p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
        <WalletButton />
      </div>

      <div className="px-4 py-4">
        {/* Balance Summary Card */}
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">Total Balance</p>
              <p className="text-3xl font-bold mt-1">
                ${(parseFloat(usdcFormatted) + totalPositionValue).toFixed(2)}
              </p>
            </div>
            <a
              href={getAddressExplorerLink(BASE_CHAIN_ID, address!)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-semibold transition-colors"
            >
              View on BaseScan ↗
            </a>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] font-medium text-blue-100 uppercase">USDC</p>
              <p className="text-lg font-bold">${usdcFormatted}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] font-medium text-blue-100 uppercase">ETH</p>
              <p className="text-lg font-bold">{ethFormatted}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] font-medium text-blue-100 uppercase">Positions</p>
              <p className="text-lg font-bold">${totalPositionValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab("positions")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
              activeTab === "positions"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
              activeTab === "history"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            History
          </button>
        </div>

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div>
            {isLoading || balancesLoading ? (
              <div className="flex flex-col items-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">Loading positions...</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Positions Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start trading to build your portfolio
                </p>
                <Link
                  href="/market/list"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Browse Markets
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {positions.map((pos, idx) => (
                  <div
                    key={`${pos.marketId}-${pos.side}-${idx}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          pos.side === "YES"
                            ? "text-emerald-700 bg-emerald-100"
                            : "text-red-700 bg-red-100"
                        }`}
                      >
                        {pos.side}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {parseFloat(pos.shares).toFixed(2)} shares
                      </span>
                    </div>

                    {/* Question */}
                    <Link
                      href={`/market/detail/${pos.marketId}`}
                      className="text-sm font-semibold text-gray-900 leading-snug block mb-3 hover:text-blue-600 transition-colors"
                    >
                      {pos.question}
                    </Link>

                    {/* Estimated Value */}
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                      <span>Est. Value</span>
                      <span className="font-semibold text-gray-700">
                        ~${(parseFloat(pos.shares) * 0.5).toFixed(2)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/market/detail/${pos.marketId}`}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg text-center transition-colors"
                      >
                        Buy More
                      </Link>
                      <Link
                        href={`/market/detail/${pos.marketId}#sell`}
                        className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-lg text-center transition-colors"
                      >
                        Sell
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            {transactions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Your transaction history will appear here
                </p>
                <a
                  href={getAddressExplorerLink(BASE_CHAIN_ID, address!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-700"
                >
                  View all on BaseScan
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map((tx, idx) => (
                  <a
                    key={`${tx.hash}-${idx}`}
                    href={getExplorerLink(tx.chainId, tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === "buy"
                            ? "bg-emerald-100"
                            : tx.type === "sell"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {tx.type === "buy" ? (
                          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        ) : tx.type === "sell" ? (
                          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 capitalize">
                          {tx.type} {tx.side}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tx.amount && (
                        <span className="text-sm font-semibold text-gray-700">
                          ${tx.amount}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                ))}

                {/* View All Link */}
                <a
                  href={getAddressExplorerLink(BASE_CHAIN_ID, address!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 py-3 text-sm text-blue-600 font-semibold hover:text-blue-700"
                >
                  View all transactions on BaseScan
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/market/list"
            className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explore Markets
          </Link>
          <a
            href={getAddressExplorerLink(BASE_CHAIN_ID, address!)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on BaseScan
          </a>
        </div>
      </div>
    </div>
  );
}
