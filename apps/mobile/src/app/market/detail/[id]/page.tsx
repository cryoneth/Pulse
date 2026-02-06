"use client";

import { useState, useCallback, useEffect, use } from "react";
import { getMarketById } from "@/lib/mock-markets";
import Link from "next/link";
import {
  useReadContract,
  useWriteContract,
  useBalance,
  useAccount,
  useConnectorClient,
  useSwitchChain,
  useConfig,
} from "wagmi";
import { type Address, formatUnits, parseUnits } from "viem";
import { getConnectorClient } from "wagmi/actions";
import { PositionFlow } from "@/components/PositionFlow";
import { WalletButton } from "@/components/WalletButton";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import {
  initLifi,
  reinitLifi,
  fetchQuote,
  executePosition,
  mapRouteToSteps,
  findBestSource,
  verifyPosition,
  SOURCE_OPTIONS,
  SELL_ABI,
  ERC20_APPROVE_ABI,
  MARKET_TOKEN_ABI,
  BASE_CHAIN_ID,
  type PositionStep,
  type SourceOption,
  type BestSourceResult,
} from "@/lib/lifi";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Route = any;

// ABI for Market Contract (read-only)
const MARKET_ABI = [
  {
    inputs: [],
    name: "question",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdcToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;


type FlowState =
  | "input"
  | "scanning"
  | "quoting"
  | "confirming"
  | "executing"
  | "verifying"
  | "success"
  | "error";

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isContract = id.startsWith("0x");
  const mockMarket = !isContract ? getMarketById(id) : null;

  const { address } = useAccount();
  const { data: walletClient } = useConnectorClient();
  const { switchChainAsync } = useSwitchChain();
  const wagmiConfig = useConfig();

  // Initialize LI.FI SDK with wallet client + chain switching
  useEffect(() => {
    if (walletClient) {
      reinitLifi(
        () => Promise.resolve(walletClient),
        async (chainId: number) => {
          await switchChainAsync({ chainId });
          const newClient = await getConnectorClient(wagmiConfig, {
            chainId,
          });
          return newClient;
        }
      );
    }
  }, [walletClient, switchChainAsync, wagmiConfig]);

  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [sourceIndex, setSourceIndex] = useState(0);
  const [flowState, setFlowState] = useState<FlowState>("input");
  const [steps, setSteps] = useState<PositionStep[]>([]);
  const [showFlow, setShowFlow] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorRecoverable, setErrorRecoverable] = useState(true);
  const [successTxHash, setSuccessTxHash] = useState<string | undefined>();

  // Auto-detect best source
  const [autoDetected, setAutoDetected] = useState<BestSourceResult | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [scanningSource, setScanningSource] = useState(false);

  // Verified position shares
  const [confirmedShares, setConfirmedShares] = useState<string | undefined>();

  // Sell flow state
  const [sellAmount, setSellAmount] = useState("");
  const [sellSide, setSellSide] = useState<"YES" | "NO">("YES");
  const [sellState, setSellState] = useState<"idle" | "approving" | "selling" | "success" | "error">("idle");
  const [sellError, setSellError] = useState("");
  const { writeContractAsync } = useWriteContract();

  // Source search filter
  const [sourceSearch, setSourceSearch] = useState("");

  // Test mode - allows positions under $5
  const [testMode, setTestMode] = useState(false);

  // Debounced amount for auto-detect (avoid scanning on every keystroke)
  const [debouncedAmount, setDebouncedAmount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(parseFloat(amount) || 0);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [amount]);

  // Auto-detect best funding source when wallet is connected or amount changes
  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    setScanningSource(true);
    findBestSource(address, debouncedAmount)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setAutoDetected(result);
          // Only auto-switch source if in auto mode
          if (isAutoMode) {
            setSourceIndex(result.index);
          }
        }
      })
      .catch(() => {
        // Silently fall back to manual selection
      })
      .finally(() => {
        if (!cancelled) setScanningSource(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, debouncedAmount, isAutoMode]);

  const { data: question, isError: questionError } = useReadContract({
    address: isContract ? (id as Address) : undefined,
    abi: MARKET_ABI,
    functionName: "question",
    chainId: BASE_CHAIN_ID,
  });

  const { data: endTime } = useReadContract({
    address: isContract ? (id as Address) : undefined,
    abi: MARKET_ABI,
    functionName: "endTime",
    chainId: BASE_CHAIN_ID,
  });

  // Read YES/NO token addresses from the market contract
  const { data: yesTokenAddress } = useReadContract({
    address: isContract ? (id as Address) : undefined,
    abi: MARKET_TOKEN_ABI,
    functionName: "yesToken",
    chainId: BASE_CHAIN_ID,
  });

  const { data: noTokenAddress } = useReadContract({
    address: isContract ? (id as Address) : undefined,
    abi: MARKET_TOKEN_ABI,
    functionName: "noToken",
    chainId: BASE_CHAIN_ID,
  });

  // Read user's YES/NO token balances
  const ERC20_BALANCE_ABI_LOCAL = [
    {
      inputs: [{ name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

  const { data: yesBalance, refetch: refetchYesBalance } = useReadContract({
    address: yesTokenAddress as Address | undefined,
    abi: ERC20_BALANCE_ABI_LOCAL,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: BASE_CHAIN_ID,
    query: { enabled: !!address && !!yesTokenAddress },
  });

  const { data: noBalance, refetch: refetchNoBalance } = useReadContract({
    address: noTokenAddress as Address | undefined,
    abi: ERC20_BALANCE_ABI_LOCAL,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: BASE_CHAIN_ID,
    query: { enabled: !!address && !!noTokenAddress },
  });

  const yesBalanceFormatted = yesBalance ? formatUnits(yesBalance as bigint, 6) : "0";
  const noBalanceFormatted = noBalance ? formatUnits(noBalance as bigint, 6) : "0";
  const hasYes = parseFloat(yesBalanceFormatted) > 0;
  const hasNo = parseFloat(noBalanceFormatted) > 0;
  const hasPosition = hasYes || hasNo;

  // Auto-select sell side based on what the user holds
  useEffect(() => {
    if (hasYes && !hasNo) setSellSide("YES");
    else if (hasNo && !hasYes) setSellSide("NO");
  }, [hasYes, hasNo]);

  // Sell handler
  const handleSell = useCallback(async () => {
    if (!sellAmount || !address || !isContract) return;
    const sellAmountRaw = parseUnits(sellAmount, 6);
    const tokenAddr = sellSide === "YES" ? (yesTokenAddress as Address) : (noTokenAddress as Address);

    setSellState("approving");
    setSellError("");

    try {
      // Step 1: Approve the market contract to spend the user's share tokens
      await writeContractAsync({
        address: tokenAddr,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [id as Address, sellAmountRaw],
        chainId: BASE_CHAIN_ID,
      });

      // Step 2: Call sell() on the market contract
      setSellState("selling");
      await writeContractAsync({
        address: id as Address,
        abi: SELL_ABI,
        functionName: "sell",
        args: [sellAmountRaw, sellSide === "YES"],
        chainId: BASE_CHAIN_ID,
      });

      setSellState("success");
      setSellAmount("");
      // Refresh balances
      refetchYesBalance();
      refetchNoBalance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sell failed";
      if (msg.includes("rejected") || msg.includes("denied")) {
        setSellError("Transaction cancelled");
      } else {
        setSellError(msg.length > 100 ? msg.slice(0, 100) + "..." : msg);
      }
      setSellState("error");
    }
  }, [sellAmount, address, isContract, sellSide, yesTokenAddress, noTokenAddress, id, writeContractAsync, refetchYesBalance, refetchNoBalance]);

  const displayQuestion = isContract ? question : mockMarket?.question;
  const displayEnd =
    isContract && endTime
      ? new Date(Number(endTime) * 1000).toLocaleDateString()
      : mockMarket?.endDate;

  const source = SOURCE_OPTIONS[sourceIndex];
  const isNativeToken =
    source.tokenAddress === "0x0000000000000000000000000000000000000000";

  // Native token balance (ETH, POL, AVAX, BNB)
  const { data: nativeBalance } = useBalance({
    address: address,
    chainId: source.chainId,
    query: { enabled: !!address && isNativeToken },
  });

  // ERC20 token balance
  const { data: erc20Balance } = useReadContract({
    address: !isNativeToken ? source.tokenAddress : undefined,
    abi: [
      {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: source.chainId,
    query: { enabled: !!address && !isNativeToken },
  });

  // ERC20 decimals
  const { data: erc20Decimals } = useReadContract({
    address: !isNativeToken ? source.tokenAddress : undefined,
    abi: [
      {
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "decimals",
    chainId: source.chainId,
    query: { enabled: !!address && !isNativeToken },
  });

  const formattedBalance = (() => {
    if (!address) return null;
    if (isNativeToken && nativeBalance) {
      const val = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals));
      return val < 0.01 ? "0" : val.toFixed(2);
    }
    if (!isNativeToken && erc20Balance !== undefined && erc20Decimals !== undefined) {
      const val = parseFloat(formatUnits(erc20Balance as bigint, erc20Decimals as number));
      return val < 0.01 ? "0" : val.toFixed(2);
    }
    return null;
  })();

  const handleConfirmPosition = useCallback(async () => {
    if (!amount || !address) return;

    const marketAddr = isContract
      ? (id as Address)
      : ("0x0000000000000000000000000000000000000001" as Address);

    setFlowState("quoting");
    setShowFlow(true);
    setSteps([]);
    setErrorMessage("");
    setSuccessTxHash(undefined);

    try {
      const fetchedRoute = await fetchQuote({
        marketAddress: marketAddr,
        side,
        amountUSDC: amount,
        recipient: address,
        fromChainId: source.chainId,
        fromTokenAddress: source.tokenAddress,
        fromDecimals: source.decimals,
      });

      setRoute(fetchedRoute);
      const initialSteps = mapRouteToSteps(fetchedRoute);
      setSteps(initialSteps);
      setFlowState("confirming");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to get quote";
      setErrorMessage(msg);
      setFlowState("error");
      setErrorRecoverable(false);
    }
  }, [amount, address, id, isContract, side, source]);

  const handleExecute = useCallback(async () => {
    if (!route) return;

    setFlowState("executing");
    setConfirmedShares(undefined);

    const marketAddr = isContract
      ? (id as Address)
      : ("0x0000000000000000000000000000000000000001" as Address);

    await executePosition(
      route,
      (updatedSteps) => setSteps(updatedSteps),
      async (txHash) => {
        setSuccessTxHash(txHash);

        // Only verify on real contracts
        if (isContract && address) {
          setFlowState("verifying");
          setSteps((prev) => [
            ...prev,
            { label: "Verifying position...", status: "verifying" as const },
          ]);

          try {
            const verified = await verifyPosition({
              marketAddress: marketAddr,
              side,
              owner: address,
            });

            if (verified) {
              setConfirmedShares(verified.shares);
              setSteps((prev) =>
                prev.map((s) =>
                  s.label === "Verifying position..."
                    ? { ...s, label: `${verified.shares} ${side} shares received`, status: "complete" as const }
                    : s
                )
              );
            } else {
              // Verification timed out but position may still be live
              setSteps((prev) =>
                prev.map((s) =>
                  s.label === "Verifying position..."
                    ? { ...s, label: "Position placed (verification pending)", status: "complete" as const }
                    : s
                )
              );
            }
          } catch {
            // Don't fail the whole flow for verification errors
            setSteps((prev) =>
              prev.map((s) =>
                s.label === "Verifying position..."
                  ? { ...s, label: "Position placed", status: "complete" as const }
                  : s
              )
            );
          }
        }

        setFlowState("success");
      },
      (error, recoverable) => {
        setErrorMessage(error);
        setErrorRecoverable(recoverable);
        setFlowState("error");
      }
    );
  }, [route, isContract, id, address, side]);

  const handleRetry = useCallback(() => {
    handleExecute();
  }, [handleExecute]);

  const handleRequote = useCallback(() => {
    setShowFlow(false);
    setFlowState("input");
    setRoute(null);
    setSteps([]);
    setTimeout(() => handleConfirmPosition(), 100);
  }, [handleConfirmPosition]);

  const handleCloseFlow = useCallback(() => {
    setShowFlow(false);
    if (flowState === "success") {
      setFlowState("input");
      setAmount("");
      setRoute(null);
      setSteps([]);
    } else if (flowState !== "executing") {
      setFlowState("input");
    }
  }, [flowState]);

  const amountNum = parseFloat(amount) || 0;
  const insufficientHint = amountNum <= 0 && amount.length > 0;
  const belowMinimum = !testMode && amountNum > 0 && amountNum < 5;

  if (!displayQuestion && isContract && questionError)
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-semibold mb-2">Failed to load market</p>
        <p className="text-sm text-gray-500 mb-4">RPC connection issue. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
        >
          Retry
        </button>
      </div>
    );
  if (!displayQuestion && isContract)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading market...</p>
        </div>
      </div>
    );
  if (!mockMarket && !isContract)
    return <div className="p-8 text-center text-gray-500">Market not found</div>;

  return (
    <div className="min-h-screen bg-page text-main pb-32">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-4 py-3 flex items-center gap-4">
        <Link
          href="/market/list"
          className="text-sm font-semibold text-muted hover:text-main"
        >
          &larr; Back
        </Link>
        <span className="font-semibold text-sm truncate opacity-50 flex-1">
          Market Detail
        </span>
        <WalletButton />
      </nav>

      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold leading-tight text-main mb-2">
          {displayQuestion}
        </h1>

        <div className="flex gap-4 text-xs font-medium text-muted mb-6">
          <span>Ends {displayEnd}</span>
          <span>$125k Volume</span>
        </div>

        {/* Chart Area */}
        <PriceHistoryChart
          marketId={id}
          yesPrice={mockMarket?.yesPrice ?? 50}
        />

        {/* Action Panel */}
        <div className="clean-card p-4">
          <h2 className="text-sm font-bold mb-4 uppercase tracking-wide text-muted">
            Open Position
          </h2>

          {/* Side Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-lg mb-5">
            <button
              onClick={() => setSide("YES")}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                side === "YES"
                  ? "bg-white shadow-sm text-emerald-500"
                  : "text-muted hover:text-main"
              }`}
            >
              YES
            </button>
            <button
              onClick={() => setSide("NO")}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                side === "NO"
                  ? "bg-white shadow-sm text-red-500"
                  : "text-muted hover:text-main"
              }`}
            >
              NO
            </button>
          </div>

          {/* Source chain/token selector */}
          <div className="mb-4">
            <label className="text-xs font-bold text-muted mb-1.5 block">
              Pay from
            </label>

            {isAutoMode && !showSourcePicker ? (
              <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {scanningSource ? (
                    <span className="text-gray-400">Scanning wallets...</span>
                  ) : autoDetected ? (
                    <>
                      <span className="text-emerald-600">Best route:</span>{" "}
                      {autoDetected.source.label}
                    </>
                  ) : (
                    source.label
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSourcePicker(true)}
                  className="text-xs text-blue-500 font-semibold hover:text-blue-700 ml-2"
                >
                  Change
                </button>
              </div>
            ) : showSourcePicker ? (
              <div className="border border-blue-400 rounded-lg overflow-hidden bg-white">
                {/* Sticky header: Best route pill + search */}
                <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
                  <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAutoMode(true);
                        setShowSourcePicker(false);
                        setSourceSearch("");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Best route
                    </button>
                    <input
                      type="text"
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      placeholder="Search..."
                      autoFocus
                      className="flex-1 min-w-0 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Scrollable token list */}
                <div className="max-h-48 overflow-y-auto">
                  {(() => {
                    const terms = sourceSearch.toLowerCase().split(/\s+/).filter(Boolean);
                    const filtered = SOURCE_OPTIONS
                      .map((opt, i) => ({ opt, i }))
                      .filter(({ opt }) => {
                        if (terms.length === 0) return true;
                        const haystack = `${opt.label} ${opt.chainName} ${opt.tokenName}`.toLowerCase();
                        return terms.every((term) => haystack.includes(term));
                      });

                    if (filtered.length === 0) {
                      return <p className="px-3 py-2 text-sm text-gray-400">No results</p>;
                    }

                    return filtered.map(({ opt, i }) => {
                      // Find balance for this source if available
                      const balanceInfo = autoDetected?.allWithBalance?.find(
                        (b) => b.index === i
                      );
                      const hasEnough = balanceInfo && balanceInfo.balance >= debouncedAmount;
                      const isRecommended = autoDetected?.index === i;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSourceIndex(i);
                            setIsAutoMode(false);
                            setShowSourcePicker(false);
                            setSourceSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors flex justify-between items-center ${
                            i === sourceIndex
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-900"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {opt.label}
                            {isRecommended && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                Best
                              </span>
                            )}
                          </span>
                          {balanceInfo && (
                            <span className={`text-xs ${hasEnough ? "text-emerald-600" : "text-gray-400"}`}>
                              ${balanceInfo.balance.toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {source.label}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSourcePicker(true)}
                    className="text-xs text-gray-400 font-semibold hover:text-gray-600"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoMode(true);
                      setShowSourcePicker(false);
                    }}
                    className="text-xs text-emerald-500 font-semibold hover:text-emerald-700"
                  >
                    Best route
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-xs font-bold text-muted">
                Amount ({source.tokenName})
              </label>
              {formattedBalance !== null && (
                <button
                  type="button"
                  onClick={() => setAmount(formattedBalance)}
                  className="text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors"
                >
                  Bal: {formattedBalance} {source.tokenName}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">
                {["USDC", "USDT", "DAI"].includes(source.tokenName) ? "$" : ""}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`clean-input ${
                  ["USDC", "USDT", "DAI"].includes(source.tokenName) ? "pl-7" : "pl-3"
                } font-bold text-lg`}
                placeholder="0.00"
              />
            </div>
            {insufficientHint && (
              <span className="text-xs text-red-500 mt-1 block">
                Enter a valid amount
              </span>
            )}
            {/* Insufficient balance warning with suggestions */}
            {formattedBalance !== null && amountNum > parseFloat(formattedBalance) && amountNum > 0 && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold text-red-700 mb-1">
                  Insufficient balance on {source.chainName}
                </p>
                {autoDetected?.allWithBalance && (() => {
                  const better = autoDetected.allWithBalance.find(s => s.balance >= amountNum);
                  const highest = autoDetected.allWithBalance.reduce((a, b) => a.balance > b.balance ? a : b, autoDetected.allWithBalance[0]);
                  if (better) {
                    return (
                      <button
                        onClick={() => {
                          setSourceIndex(better.index);
                          setIsAutoMode(false);
                        }}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Use {better.source.tokenName} on {better.source.chainName} (${better.balance.toFixed(2)} available)
                      </button>
                    );
                  } else if (highest && highest.balance > 0) {
                    return (
                      <p className="text-xs text-gray-600">
                        Max available: ${highest.balance.toFixed(2)} {highest.source.tokenName} on {highest.source.chainName}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            {belowMinimum && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <span className="text-amber-500 text-sm leading-none mt-0.5">&#9888;</span>
                <p className="text-xs font-semibold text-amber-700">
                  Minimum position is $5.00. Cross-chain fees make smaller amounts uneconomical.
                </p>
              </div>
            )}

            {/* Test Mode Toggle */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Test Mode</span>
                <span className="text-[10px] text-gray-400">(no $5 min)</span>
              </div>
              <button
                onClick={() => setTestMode(!testMode)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  testMode ? "bg-violet-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    testMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmPosition}
            disabled={
              !amount ||
              amountNum <= 0 ||
              belowMinimum ||
              !address ||
              flowState === "quoting" ||
              scanningSource
            }
            className={`w-full py-3.5 rounded-lg text-white font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              side === "YES"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {flowState === "quoting"
              ? "Getting best route..."
              : scanningSource
              ? "Scanning wallets..."
              : !address
              ? "Connect wallet first"
              : "Confirm Position"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Your funds are never stranded. If anything fails, tokens stay in
            your wallet.
          </p>
        </div>

        {/* Sell Panel — only for contract markets when user has a position */}
        {isContract && address && hasPosition && (
          <div className="clean-card p-4 mt-4">
            <h2 className="text-sm font-bold mb-4 uppercase tracking-wide text-muted">
              Sell Position
            </h2>

            {/* Position summary */}
            <div className="flex gap-3 mb-4">
              {hasYes && (
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-emerald-600">YES shares</p>
                  <p className="text-lg font-bold text-emerald-700">{parseFloat(yesBalanceFormatted).toFixed(2)}</p>
                </div>
              )}
              {hasNo && (
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-red-600">NO shares</p>
                  <p className="text-lg font-bold text-red-700">{parseFloat(noBalanceFormatted).toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Sell side toggle (only if user has both) */}
            {hasYes && hasNo && (
              <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                <button
                  onClick={() => setSellSide("YES")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    sellSide === "YES"
                      ? "bg-white shadow-sm text-emerald-500"
                      : "text-muted hover:text-main"
                  }`}
                >
                  Sell YES
                </button>
                <button
                  onClick={() => setSellSide("NO")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    sellSide === "NO"
                      ? "bg-white shadow-sm text-red-500"
                      : "text-muted hover:text-main"
                  }`}
                >
                  Sell NO
                </button>
              </div>
            )}

            {/* Sell amount input */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-xs font-bold text-muted">
                  Amount to sell
                </label>
                <button
                  type="button"
                  onClick={() => setSellAmount(sellSide === "YES" ? yesBalanceFormatted : noBalanceFormatted)}
                  className="text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors"
                >
                  Max: {parseFloat(sellSide === "YES" ? yesBalanceFormatted : noBalanceFormatted).toFixed(2)}
                </button>
              </div>
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => {
                  setSellAmount(e.target.value);
                  if (sellState === "success" || sellState === "error") setSellState("idle");
                }}
                className="clean-input font-bold text-lg"
                placeholder="0.00"
              />
            </div>

            {/* Sell button */}
            <button
              onClick={handleSell}
              disabled={
                !sellAmount ||
                parseFloat(sellAmount) <= 0 ||
                sellState === "approving" ||
                sellState === "selling"
              }
              className="w-full py-3 rounded-lg text-white font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 hover:bg-gray-900"
            >
              {sellState === "approving"
                ? "Approving..."
                : sellState === "selling"
                ? "Selling..."
                : `Sell ${sellSide} for USDC`}
            </button>

            {sellState === "success" && (
              <p className="text-xs text-emerald-600 font-semibold text-center mt-3">
                Sold successfully! USDC returned to your wallet.
              </p>
            )}
            {sellState === "error" && sellError && (
              <p className="text-xs text-red-500 font-semibold text-center mt-3">
                {sellError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Position Flow Bottom Sheet */}
      <PositionFlow
        visible={showFlow}
        side={side}
        amountUSDC={amount}
        sourceChainName={source.chainName}
        sourceTokenName={source.tokenName}
        onClose={handleCloseFlow}
        onConfirm={handleExecute}
        onRetry={handleRetry}
        onRequote={handleRequote}
        steps={steps}
        flowState={
          flowState === "quoting"
            ? "confirming"
            : flowState === "input" || flowState === "scanning"
            ? "confirming"
            : (flowState as "confirming" | "executing" | "verifying" | "success" | "error")
        }
        errorMessage={errorMessage}
        errorRecoverable={errorRecoverable}
        successTxHash={successTxHash}
        marketQuestion={
          typeof displayQuestion === "string" ? displayQuestion : undefined
        }
        confirmedShares={confirmedShares}
      />
    </div>
  );
}
