"use client";

import { useState, useCallback, useEffect, use } from "react";
import { getMarketById } from "@/lib/mock-markets";
import Link from "next/link";
import {
  useReadContract,
  useBalance,
  useAccount,
  useConnectorClient,
  useSwitchChain,
  useConfig,
} from "wagmi";
import { type Address, formatUnits } from "viem";
import { getConnectorClient } from "wagmi/actions";
import { PositionFlow } from "@/components/PositionFlow";
import { WalletButton } from "@/components/WalletButton";
import {
  initLifi,
  reinitLifi,
  fetchQuote,
  executePosition,
  mapRouteToSteps,
  type PositionStep,
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

// Source chain/token options
const SOURCE_OPTIONS = [
  // Base
  { label: "USDC on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, tokenName: "USDC", decimals: 6 },
  { label: "ETH on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x0000000000000000000000000000000000000000" as Address, tokenName: "ETH", decimals: 18 },
  { label: "WETH on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x4200000000000000000000000000000000000006" as Address, tokenName: "WETH", decimals: 18 },
  { label: "DAI on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" as Address, tokenName: "DAI", decimals: 18 },
  // Polygon
  { label: "USDC on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as Address, tokenName: "USDC", decimals: 6 },
  { label: "USDT on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as Address, tokenName: "USDT", decimals: 6 },
  { label: "POL on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0x0000000000000000000000000000000000000000" as Address, tokenName: "POL", decimals: 18 },
  { label: "WETH on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" as Address, tokenName: "WETH", decimals: 18 },
  // Arbitrum
  { label: "USDC on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address, tokenName: "USDC", decimals: 6 },
  { label: "USDT on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as Address, tokenName: "USDT", decimals: 6 },
  { label: "ETH on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0x0000000000000000000000000000000000000000" as Address, tokenName: "ETH", decimals: 18 },
  { label: "DAI on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as Address, tokenName: "DAI", decimals: 18 },
  // Ethereum
  { label: "ETH on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0x0000000000000000000000000000000000000000" as Address, tokenName: "ETH", decimals: 18 },
  { label: "USDC on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address, tokenName: "USDC", decimals: 6 },
  { label: "USDT on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address, tokenName: "USDT", decimals: 6 },
  { label: "DAI on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F" as Address, tokenName: "DAI", decimals: 18 },
  { label: "WETH on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address, tokenName: "WETH", decimals: 18 },
  // Optimism
  { label: "ETH on Optimism", chainId: 10, chainName: "Optimism", tokenAddress: "0x0000000000000000000000000000000000000000" as Address, tokenName: "ETH", decimals: 18 },
  { label: "USDC on Optimism", chainId: 10, chainName: "Optimism", tokenAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address, tokenName: "USDC", decimals: 6 },
  { label: "USDT on Optimism", chainId: 10, chainName: "Optimism", tokenAddress: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" as Address, tokenName: "USDT", decimals: 6 },
  // Avalanche
  { label: "AVAX on Avalanche", chainId: 43114, chainName: "Avalanche", tokenAddress: "0x0000000000000000000000000000000000000000" as Address, tokenName: "AVAX", decimals: 18 },
  { label: "USDC on Avalanche", chainId: 43114, chainName: "Avalanche", tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" as Address, tokenName: "USDC", decimals: 6 },
  // BSC
  { label: "BNB on BSC", chainId: 56, chainName: "BSC", tokenAddress: "0x0000000000000000000000000000000000000000" as Address, tokenName: "BNB", decimals: 18 },
  { label: "USDT on BSC", chainId: 56, chainName: "BSC", tokenAddress: "0x55d398326f99059fF775485246999027B3197955" as Address, tokenName: "USDT", decimals: 18 },
  { label: "USDC on BSC", chainId: 56, chainName: "BSC", tokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address, tokenName: "USDC", decimals: 18 },
];

type FlowState =
  | "input"
  | "quoting"
  | "confirming"
  | "executing"
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

  const { data: question } = useReadContract({
    address: isContract ? (id as Address) : undefined,
    abi: MARKET_ABI,
    functionName: "question",
  });

  const { data: endTime } = useReadContract({
    address: isContract ? (id as Address) : undefined,
    abi: MARKET_ABI,
    functionName: "endTime",
  });

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
      return val < 0.0001 ? "0" : val.toFixed(4);
    }
    if (!isNativeToken && erc20Balance !== undefined && erc20Decimals !== undefined) {
      const val = parseFloat(formatUnits(erc20Balance as bigint, erc20Decimals as number));
      return val < 0.0001 ? "0" : val.toFixed(4);
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

    await executePosition(
      route,
      (updatedSteps) => setSteps(updatedSteps),
      (txHash) => {
        setSuccessTxHash(txHash);
        setFlowState("success");
      },
      (error, recoverable) => {
        setErrorMessage(error);
        setErrorRecoverable(recoverable);
        setFlowState("error");
      }
    );
  }, [route]);

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
  const belowMinimum = false; // TODO: restore to `amountNum > 0 && amountNum < 5` after testing

  if (!displayQuestion && isContract)
    return <div className="p-8 text-center text-muted">Loading...</div>;
  if (!mockMarket && !isContract)
    return <div className="p-8 text-center text-muted">Market not found</div>;

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
        <div className="clean-card h-48 mb-8 flex items-center justify-center bg-gray-50 text-muted text-xs font-semibold uppercase tracking-wider">
          Price History Chart
        </div>

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
            <select
              value={sourceIndex}
              onChange={(e) => setSourceIndex(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SOURCE_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>
                  {opt.label}
                </option>
              ))}
            </select>
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
            {belowMinimum && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <span className="text-amber-500 text-sm leading-none mt-0.5">&#9888;</span>
                <p className="text-xs font-semibold text-amber-700">
                  Minimum position is $5.00. Cross-chain fees make smaller amounts uneconomical.
                </p>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmPosition}
            disabled={
              !amount ||
              amountNum <= 0 ||
              belowMinimum ||
              !address ||
              flowState === "quoting"
            }
            className={`w-full py-3.5 rounded-lg text-white font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              side === "YES"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {flowState === "quoting"
              ? "Getting best route..."
              : !address
              ? "Connect wallet first"
              : "Confirm Position"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Your funds are never stranded. If anything fails, tokens stay in
            your wallet.
          </p>
        </div>
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
            : flowState === "input"
            ? "confirming"
            : (flowState as "confirming" | "executing" | "success" | "error")
        }
        errorMessage={errorMessage}
        errorRecoverable={errorRecoverable}
        successTxHash={successTxHash}
        marketQuestion={
          typeof displayQuestion === "string" ? displayQuestion : undefined
        }
      />
    </div>
  );
}
