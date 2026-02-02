import type { Address } from "viem";
import {
  fetchQuote,
  executePosition,
  mapRouteToSteps,
  type PositionStep,
} from "./lifi";

/**
 * openPositionWithLifi — embeddable onboarding primitive for any prediction market UI.
 *
 * Handles the full flow: quote → swap → bridge → approve → buyFor in one call.
 * User's funds are never stranded — if anything fails, tokens stay in their wallet.
 */
export interface OpenPositionParams {
  marketAddress: Address;
  side: "YES" | "NO";
  amountUSDC: string;
  recipient: Address;
  fromChainId?: number;
  fromTokenAddress?: Address;
  onStep?: (steps: PositionStep[]) => void;
  onComplete?: (txHash?: string) => void;
  onError?: (error: string, recoverable: boolean) => void;
}

// Source chain defaults
const DEFAULT_FROM_CHAIN = 8453; // Base
const DEFAULT_FROM_TOKEN =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address; // USDC on Base

export async function openPositionWithLifi(
  params: OpenPositionParams
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ route: any; steps: PositionStep[] }> {
  const {
    marketAddress,
    side,
    amountUSDC,
    recipient,
    fromChainId = DEFAULT_FROM_CHAIN,
    fromTokenAddress = DEFAULT_FROM_TOKEN,
    onStep = () => {},
    onComplete = () => {},
    onError = () => {},
  } = params;

  // 1. Get quote
  const route = await fetchQuote({
    marketAddress,
    side,
    amountUSDC,
    recipient,
    fromChainId,
    fromTokenAddress,
  });

  const steps = mapRouteToSteps(route);

  // 2. Execute the route
  await executePosition(route, onStep, onComplete, onError);

  return { route, steps };
}
