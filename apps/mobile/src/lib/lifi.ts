import {
  createConfig,
  EVM,
  getContractCallsQuote,
  executeRoute,
  convertQuoteToRoute,
} from "@lifi/sdk";
import type { RouteExtended } from "@lifi/sdk";
import type { ContractCallsQuoteRequest } from "@lifi/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Route = any;
import {
  encodeFunctionData,
  createPublicClient,
  http,
  formatUnits,
  type Address,
  type Client,
} from "viem";
import { base, polygon, arbitrum, mainnet, optimism, avalanche, bsc } from "viem/chains";

let _initialized = false;

export function initLifi(
  getWalletClient: () => Promise<Client>,
  switchChain: (chainId: number) => Promise<Client | undefined>
) {
  if (_initialized) return;
  createConfig({
    integrator: "pulse-prediction-market",
    providers: [
      EVM({
        getWalletClient,
        switchChain,
      }),
    ],
  });
  _initialized = true;
}

export function reinitLifi(
  getWalletClient: () => Promise<Client>,
  switchChain: (chainId: number) => Promise<Client | undefined>
) {
  _initialized = false;
  initLifi(getWalletClient, switchChain);
}

// buyFor ABI fragment for encoding callData
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

// ABI for Market.sell()
export const SELL_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bool", name: "sellYes", type: "bool" },
    ],
    name: "sell",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ERC20 approve ABI
export const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Base mainnet USDC
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const BASE_CHAIN_ID = 8453;

const CHAIN_MAP: Record<number, { chain: any }> = {
  8453: { chain: base },
  137: { chain: polygon },
  42161: { chain: arbitrum },
  1: { chain: mainnet },
  10: { chain: optimism },
  43114: { chain: avalanche },
  56: { chain: bsc },
};

export interface SourceOption {
  label: string;
  chainId: number;
  chainName: string;
  tokenAddress: Address;
  tokenName: string;
  decimals: number;
}

export const SOURCE_OPTIONS: SourceOption[] = [
  // Base
  { label: "USDC on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", tokenName: "USDC", decimals: 6 },
  { label: "ETH on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x0000000000000000000000000000000000000000", tokenName: "ETH", decimals: 18 },
  { label: "WETH on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x4200000000000000000000000000000000000006", tokenName: "WETH", decimals: 18 },
  { label: "DAI on Base", chainId: 8453, chainName: "Base", tokenAddress: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", tokenName: "DAI", decimals: 18 },
  // Polygon
  { label: "USDC on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", tokenName: "USDC", decimals: 6 },
  { label: "USDT on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", tokenName: "USDT", decimals: 6 },
  { label: "POL on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0x0000000000000000000000000000000000000000", tokenName: "POL", decimals: 18 },
  { label: "WETH on Polygon", chainId: 137, chainName: "Polygon", tokenAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", tokenName: "WETH", decimals: 18 },
  // Arbitrum
  { label: "USDC on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", tokenName: "USDC", decimals: 6 },
  { label: "USDT on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", tokenName: "USDT", decimals: 6 },
  { label: "ETH on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0x0000000000000000000000000000000000000000", tokenName: "ETH", decimals: 18 },
  { label: "DAI on Arbitrum", chainId: 42161, chainName: "Arbitrum", tokenAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", tokenName: "DAI", decimals: 18 },
  // Ethereum
  { label: "ETH on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0x0000000000000000000000000000000000000000", tokenName: "ETH", decimals: 18 },
  { label: "USDC on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", tokenName: "USDC", decimals: 6 },
  { label: "USDT on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", tokenName: "USDT", decimals: 6 },
  { label: "DAI on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", tokenName: "DAI", decimals: 18 },
  { label: "WETH on Ethereum", chainId: 1, chainName: "Ethereum", tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", tokenName: "WETH", decimals: 18 },
  // Optimism
  { label: "ETH on Optimism", chainId: 10, chainName: "Optimism", tokenAddress: "0x0000000000000000000000000000000000000000", tokenName: "ETH", decimals: 18 },
  { label: "USDC on Optimism", chainId: 10, chainName: "Optimism", tokenAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", tokenName: "USDC", decimals: 6 },
  { label: "USDT on Optimism", chainId: 10, chainName: "Optimism", tokenAddress: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", tokenName: "USDT", decimals: 6 },
  // Avalanche
  { label: "AVAX on Avalanche", chainId: 43114, chainName: "Avalanche", tokenAddress: "0x0000000000000000000000000000000000000000", tokenName: "AVAX", decimals: 18 },
  { label: "USDC on Avalanche", chainId: 43114, chainName: "Avalanche", tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", tokenName: "USDC", decimals: 6 },
  // BSC
  { label: "BNB on BSC", chainId: 56, chainName: "BSC", tokenAddress: "0x0000000000000000000000000000000000000000", tokenName: "BNB", decimals: 18 },
  { label: "USDT on BSC", chainId: 56, chainName: "BSC", tokenAddress: "0x55d398326f99059fF775485246999027B3197955", tokenName: "USDT", decimals: 18 },
  { label: "USDC on BSC", chainId: 56, chainName: "BSC", tokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", tokenName: "USDC", decimals: 18 },
];

export type StepStatus = "pending" | "active" | "complete" | "error" | "verifying";

export interface PositionStep {
  label: string;
  status: StepStatus;
  txHash?: string;
  txLink?: string;
  message?: string;
}

export interface QuoteParams {
  marketAddress: Address;
  side: "YES" | "NO";
  amountUSDC: string;
  recipient: Address;
  fromChainId: number;
  fromTokenAddress: Address;
  fromDecimals?: number;
  preferAutomated?: boolean;
}

interface SourceWithBalance {
  source: SourceOption;
  index: number;
  balance: number;
  balanceRaw: bigint;
}

export async function fetchQuote(params: QuoteParams): Promise<Route> {
  const isSameToken =
    params.fromChainId === BASE_CHAIN_ID &&
    params.fromTokenAddress.toLowerCase() === BASE_USDC.toLowerCase();

  const isRealContract =
    params.marketAddress !== ("0x0000000000000000000000000000000000000001" as Address);

  if (isSameToken && isRealContract) {
    return {
      steps: [],
      id: "direct-base-usdc",
      _marketParams: {
        marketAddress: params.marketAddress,
        side: params.side,
        amountUSDC: params.amountUSDC,
        recipient: params.recipient,
      },
    };
  }

  if (isSameToken) return { steps: [], id: "same-chain-same-token" };

  const { getRoutes } = await import("@lifi/sdk");
  const decimals = params.fromDecimals ?? 6;
  const fromAmountRaw = BigInt(Math.round(parseFloat(params.amountUSDC) * 10 ** decimals)).toString();
  const toAmountRaw = BigInt(Math.round(parseFloat(params.amountUSDC) * 1e6)).toString();

  if (params.preferAutomated && isRealContract && parseFloat(params.amountUSDC) >= 10) {
    try {
      const callData = encodeFunctionData({
        abi: BUY_FOR_ABI,
        functionName: "buyFor",
        args: [BigInt(toAmountRaw), params.side === "YES", params.recipient],
      });

      const { getRoutes } = await import("@lifi/sdk");
      const result = await getRoutes({
        fromChainId: params.fromChainId,
        fromTokenAddress: params.fromTokenAddress,
        fromAddress: params.recipient,
        fromAmount: fromAmountRaw,
        toChainId: BASE_CHAIN_ID,
        toTokenAddress: BASE_USDC,
        toAddress: params.recipient,
        options: {
          slippage: 0.03,
          contractCalls: [{
            fromAmount: toAmountRaw,
            fromTokenAddress: BASE_USDC,
            toContractAddress: params.marketAddress,
            toContractCallData: callData,
            toContractGasLimit: "350000",
          }],
        }
      });

      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0] as any;
        route._isAutomated = true;
        return route;
      }
    } catch (e) {
      console.warn("Automated getRoutes failed:", e);
    }
  }

  const result = await getRoutes({
    fromChainId: params.fromChainId,
    fromTokenAddress: params.fromTokenAddress,
    fromAddress: params.recipient,
    fromAmount: fromAmountRaw,
    toChainId: BASE_CHAIN_ID,
    toTokenAddress: BASE_USDC,
    toAddress: params.recipient,
  });

  if (!result.routes || result.routes.length === 0) {
    throw new Error("No routes found for this position");
  }

  const route = result.routes[0] as any;
  if (isRealContract) {
    route._marketParams = {
      marketAddress: params.marketAddress,
      side: params.side,
      amountUSDC: params.amountUSDC,
      recipient: params.recipient,
    };
  }

  return route;
}

export type StepCallback = (steps: PositionStep[]) => void;

export function isDirectRoute(route: Route): boolean {
  return route.id === "direct-base-usdc";
}

export function getDirectRouteParams(route: Route): {
  marketAddress: Address;
  side: "YES" | "NO";
  amountUSDC: string;
  recipient: Address;
} | null {
  if (route.id === "direct-base-usdc" && route._marketParams) {
    return route._marketParams;
  }
  return null;
}

export function mapRouteToSteps(route: Route): PositionStep[] {
  const steps: PositionStep[] = [];

  if (route.id === "direct-base-usdc") {
    steps.push({ label: "Approving USDC", status: "pending" });
    steps.push({ label: "Placing position", status: "pending" });
    return steps;
  }

  const lifiSteps = route.steps || [];
  for (const step of lifiSteps) {
    const isCrossChain = step.action && step.action.fromChainId !== step.action.toChainId;
    steps.push({ label: isCrossChain ? "Swap & Bridge to Base" : "Swapping tokens", status: "pending" });
  }

  if (route._isAutomated) {
    steps[steps.length - 1].label += " + Automatic Buy";
  } else if (route._marketParams) {
    steps.push({ label: "Approving USDC on Base", status: "pending" });
    steps.push({ label: "Placing position", status: "pending" });
  }

  if (steps.length === 0) steps.push({ label: "Done", status: "complete" });
  return steps;
}

export async function executePosition(
  route: Route,
  onStep: StepCallback,
  onComplete: (txHash?: string) => void,
  onError: (error: string, recoverable: boolean) => void,
  callContract: (params: {
    marketAddress: Address;
    side: "YES" | "NO";
    amountUSDC: string;
    recipient: Address;
    onStepUpdate: (label: string, status: StepStatus, txHash?: string) => void;
  }) => Promise<string>
): Promise<void> {
  const steps = mapRouteToSteps(route);
  if (steps.length > 0) {
    steps[0].status = "active";
    onStep([...steps]);
  }

  if (route.id === "same-chain-same-token") {
    for (const step of steps) step.status = "complete";
    onStep([...steps]);
    onComplete(undefined);
    return;
  }

  try {
    if (route.steps && route.steps.length > 0) {
      await executeRoute(route, {
        updateRouteHook(updatedRoute: RouteExtended) {
          const lifiSteps = updatedRoute.steps || [];
          for (let i = 0; i < lifiSteps.length; i++) {
            const lifiStep = lifiSteps[i];
            const execution = lifiStep.execution;
            if (!execution) continue;
            const mappedIndex = i;
            if (execution.status === "DONE") {
              steps[mappedIndex].status = "complete";
              const lastProcess = execution.process?.[execution.process.length - 1];
              if (lastProcess?.txHash) {
                steps[mappedIndex].txHash = lastProcess.txHash;
                steps[mappedIndex].txLink = lastProcess.txLink;
              }
            } else if (execution.status === "FAILED") {
              steps[mappedIndex].status = "error";
              steps[mappedIndex].message = execution.process?.[execution.process.length - 1]?.message || "Step failed";
            } else if (execution.status === "PENDING") {
              steps[mappedIndex].status = "active";
            }
          }
          onStep([...steps]);
        },
      });
    }

    if (route._marketParams && !route._isAutomated) {
      const marketTxHash = await callContract({
        ...route._marketParams,
        onStepUpdate: (label, status, txHash) => {
          const step = steps.find(s => s.label === label);
          if (step) {
            step.status = status;
            if (txHash) step.txHash = txHash;
            onStep([...steps]);
          }
        }
      });
      onComplete(marketTxHash);
    } else {
      const lastCompletedStep = [...steps].reverse().find((s) => s.txHash);
      onComplete(lastCompletedStep?.txHash);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    onError(message, true);
  }
}

function getPublicClient(chainId: number) {
  const entry = CHAIN_MAP[chainId];
  const rpcUrl = RPC_URLS[chainId];
  if (!entry || !rpcUrl) return null;
  return createPublicClient({ chain: entry.chain, transport: http(rpcUrl) });
}

async function scanBalances(owner: Address): Promise<SourceWithBalance[]> {
  const results = await Promise.allSettled(
    SOURCE_OPTIONS.map(async (src, idx) => {
      const client = getPublicClient(src.chainId);
      if (!client) return null;
      const isNative = src.tokenAddress === "0x0000000000000000000000000000000000000000";
      let balanceRaw: bigint;
      if (isNative) {
        balanceRaw = await client.getBalance({ address: owner });
      } else {
        balanceRaw = (await client.readContract({
          address: src.tokenAddress,
          abi: ERC20_BALANCE_ABI,
          functionName: "balanceOf",
          args: [owner],
        })) as bigint;
      }
      const balance = parseFloat(formatUnits(balanceRaw, src.decimals));
      if (balance <= 0) return null;
      return { source: src, index: idx, balance, balanceRaw } as SourceWithBalance;
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<SourceWithBalance | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value!);
}

export interface BestSourceResult {
  source: SourceOption;
  index: number;
  balance: number;
  allWithBalance: SourceWithBalance[];
}

export async function findBestSource(
  owner: Address,
  amountNeeded: number
): Promise<BestSourceResult | null> {
  const withBalance = await scanBalances(owner);
  if (withBalance.length === 0) return null;
  const sufficient = withBalance.filter((s) => s.balance >= amountNeeded);
  const candidates = sufficient.length > 0 ? sufficient : withBalance;
  function score(s: SourceWithBalance): number {
    const isBase = s.source.chainId === BASE_CHAIN_ID;
    const isStable = ["USDC", "USDT", "DAI"].includes(s.source.tokenName);
    const isBaseUsdc = isBase && s.source.tokenAddress.toLowerCase() === BASE_USDC.toLowerCase();
    if (isBaseUsdc) return 0;
    if (isBase && isStable) return 1;
    if (!isBase && s.source.tokenName === "USDC") return 2;
    if (!isBase && isStable) return 3;
    if (isBase) return 4;
    return 5;
  }
  candidates.sort((a, b) => {
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return b.balance - a.balance;
  });
  return {
    source: candidates[0].source,
    index: candidates[0].index,
    balance: candidates[0].balance,
    allWithBalance: withBalance,
  };
}

export const MARKET_TOKEN_ABI = [
  { inputs: [], name: "yesToken", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "noToken", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
] as const;

export interface VerifiedPosition {
  shares: string;
  sharesRaw: bigint;
  tokenAddress: Address;
  side: "YES" | "NO";
}

export async function verifyPosition(params: {
  marketAddress: Address;
  side: "YES" | "NO";
  owner: Address;
  previousBalance?: bigint;
  maxAttempts?: number;
  intervalMs?: number;
}): Promise<VerifiedPosition | null> {
  const { marketAddress, side, owner, previousBalance = BigInt(0), maxAttempts = 10, intervalMs = 3000 } = params;
  const client = getPublicClient(BASE_CHAIN_ID);
  if (!client) return null;
  const tokenAddress = (await client.readContract({
    address: marketAddress,
    abi: MARKET_TOKEN_ABI,
    functionName: side === "YES" ? "yesToken" : "noToken",
  })) as Address;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const balance = (await client.readContract({
      address: tokenAddress,
      abi: ERC20_BALANCE_ABI,
      functionName: "balanceOf",
      args: [owner],
    })) as bigint;
    if (balance > previousBalance) {
      const newShares = balance - previousBalance;
      return { shares: formatUnits(newShares, 6), sharesRaw: newShares, tokenAddress, side };
    }
    if (attempt < maxAttempts - 1) await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

const RPC_URLS: Record<number, string> = {
  8453: "https://base.publicnode.com",
  137: "https://polygon-bor-rpc.publicnode.com",
  42161: "https://arbitrum-one-rpc.publicnode.com",
  1: "https://ethereum-rpc.publicnode.com",
  10: "https://optimism-rpc.publicnode.com",
  43114: "https://avalanche-c-chain-rpc.publicnode.com",
  56: "https://bsc-rpc.publicnode.com",
};

const ERC20_BALANCE_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;