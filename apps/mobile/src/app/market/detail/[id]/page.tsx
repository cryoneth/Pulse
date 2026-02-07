"use client";

import { useState, useCallback, useEffect, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  isDirectRoute,
  getDirectRouteParams,
  SOURCE_OPTIONS,
  SELL_ABI,
  ERC20_APPROVE_ABI,
  MARKET_TOKEN_ABI,
  BASE_CHAIN_ID,
  BASE_USDC,
  type PositionStep,
  type SourceOption,
  type BestSourceResult,
} from "@/lib/lifi";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Route = any;

// ABI for Market.buyFor
const BUY_FOR_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bool", name: "buyYes", type: "bool" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "buyFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

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

// Helper to save or update transaction in localStorage
function updateTransaction(
  address: string,
  txHash: string,
  data: {
    type: "buy" | "sell" | "approve" | "bridge";
    side?: "YES" | "NO";
    amount: string;
    chainId?: number;
    status: "pending" | "complete" | "error";
    marketQuestion?: string;
    marketId?: string;
  }
) {
  const key = `pulse_txns_${address}`;
  const existing = localStorage.getItem(key);
  const txns: any[] = existing ? JSON.parse(existing) : [];
  
  const index = txns.findIndex(t => t.hash === txHash);
  if (index !== -1) {
    txns[index] = { ...txns[index], ...data, timestamp: txns[index].timestamp || Date.now() };
  } else {
    txns.unshift({
      hash: txHash,
      ...data,
      timestamp: Date.now(),
      chainId: data.chainId || BASE_CHAIN_ID,
    });
  }
  
  localStorage.setItem(key, JSON.stringify(txns.slice(0, 50)));
  // Dispatch event to notify other components (like homepage portfolio)
  window.dispatchEvent(new Event("storage"));
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-[#0C4A6E] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-500">Loading market...</p>
        </div>
      </div>
    }>
      <MarketDetailContent params={params} />
    </Suspense>
  );
}

function MarketDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const initialSide = (searchParams.get("side")?.toUpperCase() as "YES" | "NO") || "YES";
  
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

  const [side, setSide] = useState<"YES" | "NO">(initialSide);
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

  // Trade mode settings
  const [testMode, setTestMode] = useState(false);
  const [isAutomatedMode, setIsAutomatedMode] = useState(true);

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

  const displayQuestion = isContract ? question : mockMarket?.question;

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
      const sellTxHash = await writeContractAsync({
        address: id as Address,
        abi: SELL_ABI,
        functionName: "sell",
        args: [sellAmountRaw, sellSide === "YES"],
        chainId: BASE_CHAIN_ID,
      });

      // Update transaction status
      updateTransaction(address, sellTxHash, {
        type: "sell",
        side: sellSide,
        amount: sellAmount,
        status: "complete",
        marketId: id,
        marketQuestion: typeof displayQuestion === 'string' ? displayQuestion : undefined
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
  }, [sellAmount, address, isContract, sellSide, yesTokenAddress, noTokenAddress, id, writeContractAsync, refetchYesBalance, refetchNoBalance, displayQuestion]);

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
        outputs: [{ name: "uint8", type: "uint8" }],
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
        preferAutomated: isAutomatedMode,
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
  }, [amount, address, id, isContract, side, source, isAutomatedMode]);

  const handleExecute = useCallback(async () => {
    if (!route) return;

    setFlowState("executing");
    setConfirmedShares(undefined);

    const marketAddr = isContract
      ? (id as Address)
      : ("0x0000000000000000000000000000000000000001" as Address);

    // Handle direct USDC on Base route (no LI.FI needed)
    if (isDirectRoute(route)) {
      const directParams = getDirectRouteParams(route);
      if (!directParams || !address) {
        setErrorMessage("Invalid route parameters");
        setErrorRecoverable(false);
        setFlowState("error");
        return;
      }

      const currentSteps = mapRouteToSteps(route);
      currentSteps[0].status = "active";
      setSteps([...currentSteps]);

      try {
        // Step 1: Approve USDC
        const amountRaw = parseUnits(directParams.amountUSDC, 6);

        await writeContractAsync({
          address: BASE_USDC as Address,
          abi: ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [directParams.marketAddress, amountRaw],
          chainId: BASE_CHAIN_ID,
        });

        currentSteps[0].status = "complete";
        currentSteps[1].status = "active";
        setSteps([...currentSteps]);

        // Step 2: Call buyFor
        const txHash = await writeContractAsync({
          address: directParams.marketAddress,
          abi: BUY_FOR_ABI,
          functionName: "buyFor",
          args: [amountRaw, directParams.side === "YES", directParams.recipient],
          chainId: BASE_CHAIN_ID,
        });

        currentSteps[1].status = "complete";
        currentSteps[1].txHash = txHash;
        setSteps([...currentSteps]);
        setSuccessTxHash(txHash);

        // Save transaction to history
        updateTransaction(address, txHash, {
          type: "buy",
          side: directParams.side,
          amount: directParams.amountUSDC,
          status: "complete",
          marketId: id,
          marketQuestion: typeof displayQuestion === 'string' ? displayQuestion : undefined
        });

        // Verify position
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
              setSteps((prev) =>
                prev.map((s) =>
                  s.label === "Verifying position..."
                    ? { ...s, label: "Position placed (verification pending)", status: "complete" as const }
                    : s
                )
              );
            }
          } catch {
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
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Transaction failed";
        if (message.includes("rejected") || message.includes("denied")) {
          setErrorMessage("Transaction cancelled");
          setErrorRecoverable(true);
        } else {
          setErrorMessage(message.length > 100 ? message.slice(0, 100) + "..." : message);
          setErrorRecoverable(true);
        }
        setFlowState("error");
        return;
      }
    }

    // Standard execution: LI.FI Swap/Bridge + Manual Contract Call
    await executePosition(
      route,
      (updatedSteps) => setSteps(updatedSteps),
      async (txHash) => {
        setSuccessTxHash(txHash);

        // Update transaction to complete
        if (address && txHash) {
          updateTransaction(address, txHash, {
            type: "buy",
            side,
            amount,
            status: "complete",
            marketQuestion: typeof displayQuestion === 'string' ? displayQuestion : undefined,
            marketId: id
          });
        }

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
              setSteps((prev) =>
                prev.map((s) =>
                  s.label === "Verifying position..."
                    ? { ...s, label: "Position placed (verification pending)", status: "complete" as const }
                    : s
                )
              );
            }
          } catch {
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
      (error) => {
        setErrorMessage(error);
        setErrorRecoverable(true);
        setFlowState("error");
        
        // Find the last active step to get a txHash if possible
        const lastTxHash = steps.find(s => s.status === 'active' || s.status === 'complete')?.txHash;
        if (address && lastTxHash) {
          updateTransaction(address, lastTxHash, {
            type: "buy",
            amount,
            status: "error"
          });
        }
      },
      // callContract helper implementation
      async (params) => {
        const { marketAddress, side, amountUSDC, recipient, onStepUpdate } = params;
        const amountRaw = parseUnits(amountUSDC, 6);

        // Ensure we are on Base chain before proceeding
        onStepUpdate("Approving USDC on Base", "active");
        try {
          await switchChainAsync({ chainId: BASE_CHAIN_ID });
        } catch (err) {
          // Continue anyway
        }

        // Step 1: Approve USDC
        await writeContractAsync({
          address: BASE_USDC as Address,
          abi: ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [marketAddress, amountRaw],
          chainId: BASE_CHAIN_ID,
        });
        onStepUpdate("Approving USDC on Base", "complete");

        // Step 2: Call buyFor
        onStepUpdate("Placing position", "active");
        const txHash = await writeContractAsync({
          address: marketAddress,
          abi: BUY_FOR_ABI,
          functionName: "buyFor",
          args: [amountRaw, side === "YES", recipient],
          chainId: BASE_CHAIN_ID,
        });
        
        // Save as pending immediately
        if (address) {
          updateTransaction(address, txHash, {
            type: "buy",
            side,
            amount: amountUSDC,
            status: "pending",
            marketQuestion: typeof displayQuestion === 'string' ? displayQuestion : undefined,
            marketId: id
          });
        }
        
        onStepUpdate("Placing position", "complete", txHash);

        return txHash;
      }
    );
  }, [route, isContract, id, address, side, writeContractAsync, source.chainId, amount, displayQuestion, switchChainAsync, steps]);

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

  // Error state
  if (!displayQuestion && isContract && questionError)
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load market</p>
          <p className="text-sm text-stone-500 mb-4">RPC connection issue. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#0C4A6E] text-white font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );

  // Loading state
  if (!displayQuestion && isContract)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-[#0C4A6E] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-500">Loading market...</p>
        </div>
      </div>
    );

  // Not found state
  if (!mockMarket && !isContract)
    return <div className="p-8 text-center text-stone-500">Market not found</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 pb-32">
      {/* Navbar */}
      <nav className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-4">
        <Link
          href="/market/list"
          className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          &larr; Back
        </Link>
        <span className="font-medium text-sm truncate text-stone-400 flex-1">
          Market Detail
        </span>
        <WalletButton />
      </nav>

      <div className="px-4 py-6">
        {/* Market Question - Editorial headline */}
        <h1 className="text-2xl font-serif font-semibold leading-tight text-stone-900 mb-3">
          {displayQuestion}
        </h1>

        <div className="flex gap-4 text-xs font-medium text-stone-500 mb-6">
          <span>Ends {displayEnd}</span>
          <span>$125k Volume</span>
        </div>

        {/* Chart Area */}
        <PriceHistoryChart
          marketId={id}
          yesPrice={mockMarket?.yesPrice ?? 50}
        />

        {/* Action Panel - Clean card */}
        <div className="bg-white border border-stone-200 p-6 mt-6">
          <h2 className="text-xs font-medium mb-5 uppercase tracking-wider text-stone-500">
            Open Position
          </h2>

          {/* Side Toggle - Equal weight bordered buttons */}
          <div className="flex border border-stone-200 mb-5">
            <button
              onClick={() => setSide("YES")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                side === "YES"
                  ? "bg-green-600 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setSide("NO")}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-stone-200 ${
                side === "NO"
                  ? "bg-red-600 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              No
            </button>
          </div>

          {/* Source chain/token selector */}
          <div className="mb-5">
            <label className="text-xs font-medium text-stone-500 mb-2 block uppercase tracking-wider">
              Pay from
            </label>

            {isAutoMode && !showSourcePicker ? (
              <div className="w-full px-4 py-3 bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-900">
                  {scanningSource ? (
                    <span className="text-stone-400">Scanning wallets...</span>
                  ) : autoDetected ? (
                    <>
                      <span className="text-green-600">Best route:</span>{" "}
                      {autoDetected.source.label}
                    </>
                  ) : (
                    source.label
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSourcePicker(true)}
                  className="text-xs text-[#0C4A6E] font-medium hover:underline ml-2"
                >
                  Change
                </button>
              </div>
            ) : showSourcePicker ? (
              <div className="border border-[#0C4A6E] overflow-hidden bg-white">
                {/* Sticky header: Best route pill + search */}
                <div className="sticky top-0 bg-white z-10 border-b border-stone-100">
                  <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAutoMode(true);
                        setShowSourcePicker(false);
                        setSourceSearch("");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors whitespace-nowrap"
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
                      className="flex-1 min-w-0 px-3 py-1.5 bg-stone-50 border border-stone-200 text-sm font-medium text-stone-900 focus:outline-none focus:border-[#0C4A6E]"
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
                      return <p className="px-3 py-2 text-sm text-stone-400">No results</p>;
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
                          className={`w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-stone-50 transition-colors flex justify-between items-center border-t border-stone-100 first:border-t-0 ${
                            i === sourceIndex
                              ? "bg-stone-50 text-[#0C4A6E]"
                              : "text-stone-900"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {opt.label}
                            {isRecommended && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5">
                                Best
                              </span>
                            )}
                          </span>
                          {balanceInfo && (
                            <span className={`text-xs tabular-nums ${hasEnough ? "text-green-600" : "text-stone-400"}`}>
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
              <div className="w-full px-4 py-3 bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-900">
                  {source.label}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSourcePicker(true)}
                    className="text-xs text-stone-500 font-medium hover:text-stone-700"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoMode(true);
                      setShowSourcePicker(false);
                    }}
                    className="text-xs text-green-600 font-medium hover:text-green-700"
                  >
                    Best route
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Amount ({source.tokenName})
              </label>
              {formattedBalance !== null && (
                <button
                  type="button"
                  onClick={() => setAmount(formattedBalance)}
                  className="text-xs text-[#0C4A6E] font-medium hover:underline transition-colors"
                >
                  Bal: {formattedBalance} {source.tokenName}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
                {["USDC", "USDT", "DAI"].includes(source.tokenName) ? "$" : ""}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-3 border-2 border-stone-300 bg-white text-stone-900 text-lg font-medium tabular-nums focus:border-[#0C4A6E] focus:outline-none transition-colors ${
                  ["USDC", "USDT", "DAI"].includes(source.tokenName) ? "pl-8" : "pl-4"
                }`}
                placeholder="0.00"
              />
            </div>
            {insufficientHint && (
              <span className="text-xs text-red-600 mt-1 block">
                Enter a valid amount
              </span>
            )}
            {/* Insufficient balance warning with suggestions */}
            {formattedBalance !== null && amountNum > parseFloat(formattedBalance) && amountNum > 0 && (
              <div className="mt-2 bg-red-50 border border-red-200 px-3 py-2.5">
                <p className="text-xs font-medium text-red-700 mb-1">
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
                        className="text-xs text-[#0C4A6E] font-medium hover:underline"
                      >
                        Use {better.source.tokenName} on {better.source.chainName} (${better.balance.toFixed(2)} available)
                      </button>
                    );
                  } else if (highest && highest.balance > 0) {
                    return (
                      <p className="text-xs text-stone-600">
                        Max available: ${highest.balance.toFixed(2)} {highest.source.tokenName} on {highest.source.chainName}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            {belowMinimum && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 px-3 py-2.5">
                <span className="text-amber-600 text-sm leading-none mt-0.5">!</span>
                <p className="text-xs font-medium text-amber-700">
                  Minimum position is $5.00. Cross-chain fees make smaller amounts uneconomical.
                </p>
              </div>
            )}

            {/* Mode Toggles */}
            <div className="mt-6 space-y-3 pt-4 border-t border-stone-100">
              {/* Automated Trade Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-stone-900 uppercase tracking-wider">One-Click Trade</span>
                  <span className="text-[10px] text-stone-400 font-serif">Single signature automation</span>
                </div>
                <button
                  onClick={() => setIsAutomatedMode(!isAutomatedMode)}
                  className={`relative w-10 h-5 transition-colors duration-200 border border-stone-300 ${
                    isAutomatedMode ? "bg-green-600 border-green-700" : "bg-stone-100"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-[14px] h-[14px] transition-transform duration-200 ${
                      isAutomatedMode ? "translate-x-5 bg-white" : "bg-stone-400"
                    }`}
                  />
                </button>
              </div>
              
              {isAutomatedMode && !belowMinimum && amountNum > 0 && amountNum < 10 && (
                <p className="text-[10px] text-[#0C4A6E] font-medium bg-blue-50 p-2 border border-blue-100">
                  Note: One-Click requires a $10 minimum. This trade will proceed using the standard manual flow.
                </p>
              )}

              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Test Mode</span>
                  <span className="text-[10px] text-stone-400 font-serif">Bypass $5 minimum</span>
                </div>
                <button
                  onClick={() => setTestMode(!testMode)}
                  className={`relative w-10 h-5 transition-colors duration-200 border border-stone-300 ${
                    testMode ? "bg-[#0C4A6E] border-[#0C4A6E]" : "bg-stone-100"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-[14px] h-[14px] transition-transform duration-200 ${
                      testMode ? "translate-x-5 bg-white" : "bg-stone-400"
                    }`}
                  />
                </button>
              </div>
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
            className={`w-full py-4 text-white font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              side === "YES"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {flowState === "quoting"
              ? "Establishing route..."
              : scanningSource
              ? "Scanning wallets..."
              : !address
              ? "Connect wallet to trade"
              : "Confirm Position"}
          </button>

          <p className="text-xs text-stone-400 text-center mt-5 font-serif italic">
            Your funds are never stranded. If anything fails, tokens stay in
            your wallet.
          </p>
        </div>

        {/* Sell Panel — only for contract markets when user has a position */}
        {isContract && address && hasPosition && (
          <div className="bg-white border border-stone-200 p-6 mt-6">
            <h2 className="text-xs font-medium mb-5 uppercase tracking-wider text-stone-500">
              Liquidate Position
            </h2>

            {/* Position summary */}
            <div className="flex gap-3 mb-6">
              {hasYes && (
                <div className="flex-1 bg-white border border-green-200 px-4 py-3">
                  <p className="text-[10px] font-medium text-green-700 uppercase tracking-widest">Yes shares</p>
                  <p className="text-xl font-semibold text-stone-900 tabular-nums mt-1">{parseFloat(yesBalanceFormatted).toFixed(2)}</p>
                </div>
              )}
              {hasNo && (
                <div className="flex-1 bg-white border border-red-200 px-4 py-3">
                  <p className="text-[10px] font-medium text-red-700 uppercase tracking-widest">No shares</p>
                  <p className="text-xl font-semibold text-stone-900 tabular-nums mt-1">{parseFloat(noBalanceFormatted).toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Sell side toggle (only if user has both) */}
            {hasYes && hasNo && (
              <div className="flex border border-stone-200 mb-5">
                <button
                  onClick={() => setSellSide("YES")}
                  className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                    sellSide === "YES"
                      ? "bg-[#0C4A6E] text-white"
                      : "bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Sell Yes
                </button>
                <button
                  onClick={() => setSellSide("NO")}
                  className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-l border-stone-200 ${
                    sellSide === "NO"
                      ? "bg-[#0C4A6E] text-white"
                      : "bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Sell No
                </button>
              </div>
            )}

            {/* Sell amount input */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Shares to sell
                </label>
                <button
                  type="button"
                  onClick={() => setSellAmount(sellSide === "YES" ? yesBalanceFormatted : noBalanceFormatted)}
                  className="text-xs text-[#0C4A6E] font-medium hover:underline transition-colors font-serif"
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
                className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 text-lg font-medium tabular-nums focus:border-[#0C4A6E] focus:outline-none transition-colors"
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
              className="w-full py-4 text-white font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-stone-900 hover:bg-stone-800"
            >
              {sellState === "approving"
                ? "Approving..."
                : sellState === "selling"
                ? "Executing..."
                : `Sell ${sellSide} shares`}
            </button>

            {sellState === "success" && (
              <p className="text-xs text-green-600 font-medium text-center mt-5 bg-green-50 py-2 border border-green-100">
                Position closed. USDC returned to wallet.
              </p>
            )}
            {sellState === "error" && sellError && (
              <p className="text-xs text-red-600 font-medium text-center mt-5 bg-red-50 py-2 border border-red-100">
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