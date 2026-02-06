"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, polygon, mainnet, arbitrum, optimism, avalanche, bsc } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const hasProjectId = projectId && projectId !== "...";

const connectors = [
  injected(),
  ...(hasProjectId
    ? [
        walletConnect({
          projectId,
          metadata: {
            name: "Pulse",
            description: "Pulse Prediction Market",
            url: "https://pulse.app",
            icons: ["https://avatars.githubusercontent.com/u/37784886"],
          },
        }),
      ]
    : []),
];

export const config = createConfig({
  chains: [base, polygon, mainnet, arbitrum, optimism, avalanche, bsc],
  connectors,
  transports: {
    // Using browser-compatible public RPCs (CORS-enabled)
    [base.id]: http("https://base.publicnode.com"),
    [polygon.id]: http("https://polygon-bor-rpc.publicnode.com"),
    [mainnet.id]: http("https://ethereum-rpc.publicnode.com"),
    [arbitrum.id]: http("https://arbitrum-one-rpc.publicnode.com"),
    [optimism.id]: http("https://optimism-rpc.publicnode.com"),
    [avalanche.id]: http("https://avalanche-c-chain-rpc.publicnode.com"),
    [bsc.id]: http("https://bsc-rpc.publicnode.com"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
