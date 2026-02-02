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
import { encodeFunctionData, type Address, type Client } from "viem";

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

// Base mainnet USDC
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_CHAIN_ID = 8453;

export type StepStatus = "pending" | "active" | "complete" | "error";

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
  amountUSDC: string; // human-readable e.g. "2.00"
  recipient: Address;
  fromChainId: number;
  fromTokenAddress: Address;
  fromDecimals?: number; // decimals for source token (default 6 for USDC)
}

export async function getPositionQuote(
  params: QuoteParams
): Promise<ContractCallsQuoteRequest> {
  const amountRaw = BigInt(
    Math.round(parseFloat(params.amountUSDC) * 1e6)
  ).toString();

  const callData = encodeFunctionData({
    abi: BUY_FOR_ABI,
    functionName: "buyFor",
    args: [BigInt(amountRaw), params.side === "YES", params.recipient],
  });

  const quoteRequest: ContractCallsQuoteRequest = {
    fromChain: params.fromChainId,
    fromToken: params.fromTokenAddress,
    fromAddress: params.recipient,
    toChain: BASE_CHAIN_ID,
    toToken: BASE_USDC,
    toAmount: amountRaw,
    contractCalls: [
      {
        fromAmount: amountRaw,
        fromTokenAddress: BASE_USDC,
        toContractAddress: params.marketAddress,
        toContractCallData: callData,
        toContractGasLimit: "300000",
      },
    ],
  };

  return quoteRequest;
}

export async function fetchQuote(params: QuoteParams): Promise<Route> {
  // If no real market contract deployed, fall back to a simple swap+bridge
  // so the LI.FI flow can be tested end-to-end
  const isRealContract =
    params.marketAddress !== ("0x0000000000000000000000000000000000000001" as Address);

  if (isRealContract) {
    const request = await getPositionQuote(params);
    const quote = await getContractCallsQuote(request);
    return convertQuoteToRoute(quote);
  }

  // Fallback: use getRoutes for a plain swap/bridge to USDC on Base
  // This lets you test the full LI.FI flow before deploying the market contract

  const isSameToken =
    params.fromChainId === BASE_CHAIN_ID &&
    params.fromTokenAddress.toLowerCase() === BASE_USDC.toLowerCase();

  if (isSameToken) {
    // Already USDC on Base — no swap/bridge needed. Return a synthetic
    // empty route so the UI can show "Placing position" only.
    return { steps: [], id: "same-chain-same-token" };
  }

  const { getRoutes } = await import("@lifi/sdk");
  const decimals = params.fromDecimals ?? 6;
  const fromAmountRaw = BigInt(
    Math.round(parseFloat(params.amountUSDC) * 10 ** decimals)
  ).toString();

  const result = await getRoutes({
    fromChainId: params.fromChainId,
    fromTokenAddress: params.fromTokenAddress,
    fromAddress: params.recipient,
    fromAmount: fromAmountRaw,
    toChainId: BASE_CHAIN_ID,
    toTokenAddress: BASE_USDC,
  });

  if (!result.routes || result.routes.length === 0) {
    throw new Error("No routes found for this token/chain combination");
  }

  return result.routes[0];
}

export type StepCallback = (steps: PositionStep[]) => void;

export function mapRouteToSteps(route: Route): PositionStep[] {
  const steps: PositionStep[] = [];
  const lifiSteps = route.steps || [];

  for (const step of lifiSteps) {
    const action = step.action;
    const isCrossChain =
      action && action.fromChainId !== action.toChainId;
    if (isCrossChain) {
      steps.push({ label: "Swap & Bridge to Base", status: "pending" });
    } else {
      steps.push({ label: "Swapping tokens", status: "pending" });
    }
  }

  // Always add the contract call step at the end
  steps.push({ label: "Placing position", status: "pending" });

  // If same-chain, ensure at least approval + position
  if (steps.length === 1) {
    steps.unshift({ label: "Approving USDC", status: "pending" });
  }

  return steps;
}

export async function executePosition(
  route: Route,
  onStep: StepCallback,
  onComplete: (txHash?: string) => void,
  onError: (error: string, recoverable: boolean) => void
): Promise<void> {
  const steps = mapRouteToSteps(route);
  let currentStepIndex = 0;

  // Set first step active
  if (steps.length > 0) {
    steps[0].status = "active";
    onStep([...steps]);
  }

  // Synthetic route (same-chain same-token) — nothing for LI.FI to execute
  if (route.id === "same-chain-same-token") {
    for (const step of steps) {
      step.status = "complete";
    }
    onStep([...steps]);
    onComplete(undefined);
    return;
  }

  try {
    await executeRoute(route, {
      updateRouteHook(updatedRoute: RouteExtended) {
        const lifiSteps = updatedRoute.steps || [];
        let allDone = true;

        for (let i = 0; i < lifiSteps.length; i++) {
          const lifiStep = lifiSteps[i];
          const execution = lifiStep.execution;

          if (!execution) continue;

          const mappedIndex = Math.min(i, steps.length - 2); // last step is contract call

          if (execution.status === "DONE") {
            if (mappedIndex <= steps.length - 2) {
              steps[mappedIndex].status = "complete";
              const lastProcess =
                execution.process?.[execution.process.length - 1];
              if (lastProcess?.txHash) {
                steps[mappedIndex].txHash = lastProcess.txHash;
                steps[mappedIndex].txLink = lastProcess.txLink;
              }
            }
          } else if (execution.status === "FAILED") {
            steps[mappedIndex].status = "error";
            steps[mappedIndex].message =
              execution.process?.[execution.process.length - 1]?.message ||
              "Step failed";
            allDone = false;
          } else if (execution.status === "PENDING") {
            steps[mappedIndex].status = "active";
            allDone = false;
            const lastProcess =
              execution.process?.[execution.process.length - 1];
            if (lastProcess?.txHash) {
              steps[mappedIndex].txHash = lastProcess.txHash;
              steps[mappedIndex].txLink = lastProcess.txLink;
            }
          } else {
            allDone = false;
          }
        }

        // Advance currentStepIndex
        while (
          currentStepIndex < steps.length - 1 &&
          steps[currentStepIndex].status === "complete"
        ) {
          currentStepIndex++;
          if (steps[currentStepIndex].status === "pending") {
            steps[currentStepIndex].status = "active";
          }
        }

        onStep([...steps]);

        // If all LI.FI steps done, mark contract call as active then complete
        if (allDone && lifiSteps.length > 0) {
          const lastStep = steps[steps.length - 1];
          if (lastStep.status !== "complete") {
            lastStep.status = "complete";
            const lastLifiStep = lifiSteps[lifiSteps.length - 1];
            const lastProcess =
              lastLifiStep.execution?.process?.[
                lastLifiStep.execution.process.length - 1
              ];
            if (lastProcess?.txHash) {
              lastStep.txHash = lastProcess.txHash;
              lastStep.txLink = lastProcess.txLink;
            }
            onStep([...steps]);
          }
        }
      },
    });

    // Mark all steps complete
    for (const step of steps) {
      if (step.status !== "error") {
        step.status = "complete";
      }
    }
    onStep([...steps]);

    // Find the last tx hash
    const lastCompletedStep = [...steps]
      .reverse()
      .find((s) => s.txHash);
    onComplete(lastCompletedStep?.txHash);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    // Parse error types
    if (
      message.includes("rejected") ||
      message.includes("denied") ||
      message.includes("cancelled")
    ) {
      onError("Transaction cancelled", true);
    } else if (
      message.includes("expired") ||
      message.includes("quote")
    ) {
      onError("Quote expired — please re-quote", false);
    } else if (message.includes("insufficient") && message.includes("gas")) {
      onError("Insufficient gas — check your wallet balance", true);
    } else if (message.includes("insufficient")) {
      onError("Insufficient balance", true);
    } else if (message.includes("revert")) {
      onError(
        "Position couldn't open. Funds are in your wallet on Base.",
        true
      );
    } else {
      onError(message, true);
    }

    // Mark current step as error
    if (currentStepIndex < steps.length) {
      steps[currentStepIndex].status = "error";
      steps[currentStepIndex].message = message;
      onStep([...steps]);
    }
  }
}
