"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - only render wallet state on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder during SSR to match client initial render
    return (
      <div className="px-4 py-2 bg-stone-100 text-sm font-medium text-stone-400">
        Loading...
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="group flex items-center gap-2 px-3 py-2 bg-white text-stone-700 text-xs font-medium border border-stone-200 hover:border-stone-300 transition-colors duration-200"
      >
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="tabular-nums">{address.slice(0, 6)}...{address.slice(-4)}</span>
        <svg className="w-3 h-3 text-stone-400 group-hover:text-stone-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
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
        className="px-4 py-2 bg-[#0C4A6E] hover:bg-[#075985] text-white text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting
          </span>
        ) : (
          "Connect"
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-stone-200 z-20 overflow-hidden">
            <div className="p-3 border-b border-stone-100">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Select Wallet
              </p>
            </div>
            <div className="p-2">
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
                  className="flex items-center gap-3 w-full text-left px-3 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors duration-150"
                >
                  <span className="w-8 h-8 bg-stone-100 flex items-center justify-center text-stone-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </span>
                  {connector.name}
                </button>
              ))}
              {uniqueConnectors.length === 0 && (
                <div className="px-3 py-4 text-sm text-stone-400 text-center">
                  No wallets detected.<br />
                  <span className="text-xs">Install a browser wallet extension.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {(connectError || error) && !showMenu && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-red-50 border border-red-200 p-3 z-20">
          <p className="text-xs text-red-700 font-medium">
            {connectError || error?.message || "Connection failed"}
          </p>
        </div>
      )}
    </div>
  );
}
