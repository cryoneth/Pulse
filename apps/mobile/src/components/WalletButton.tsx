"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200 hover:bg-gray-200 transition-colors"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  // Deduplicate connectors by name (EIP-6963 can surface duplicates)
  const seen = new Set<string>();
  const uniqueConnectors = connectors.filter((c) => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="relative">
      <button
        onClick={() => {
          setConnectError(null);
          setShowMenu(!showMenu);
        }}
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
      >
        {isPending ? "Connecting..." : "Connect"}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Select Wallet
            </div>
            {uniqueConnectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  setConnectError(null);
                  connect(
                    { connector },
                    {
                      onError(err) {
                        setConnectError(
                          err.message.includes("rejected")
                            ? "Connection rejected"
                            : err.message.length > 60
                            ? err.message.slice(0, 60) + "..."
                            : err.message
                        );
                      },
                    }
                  );
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                {connector.name}
              </button>
            ))}
            {uniqueConnectors.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400">
                No wallets detected. Install a browser wallet extension.
              </div>
            )}
          </div>
        </>
      )}

      {(connectError || error) && !showMenu && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-red-50 border border-red-200 rounded-lg p-3 z-20">
          <p className="text-xs text-red-600 font-medium">
            {connectError || error?.message || "Connection failed"}
          </p>
        </div>
      )}
    </div>
  );
}
