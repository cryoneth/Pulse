"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";

export function Header() {
  const pathname = usePathname();
  const isMarketDetail = pathname.startsWith("/market/detail/");

  return (
    <nav className="sticky top-0 z-20 bg-white border-b border-stone-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Link href="/">
          <div className="border-2 border-[#0C4A6E] px-2 py-0.5">
            <h1 className="text-xl font-serif font-semibold text-[#0C4A6E] tracking-tight">
              Pulse
            </h1>
          </div>
        </Link>
        {isMarketDetail && (
          <Link
            href="/market/list"
            className="text-xs font-bold text-stone-400 hover:text-[#0C4A6E] transition-colors uppercase tracking-widest flex items-center gap-1 border-l border-stone-200 pl-3"
          >
            &larr; Back
          </Link>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            localStorage.removeItem("pulse_onboarding_complete");
            window.location.reload();
          }}
          className="p-2 text-stone-400 hover:text-[#0C4A6E] transition-colors"
          title="Show Tour"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.443 1.103m-3.13 0a1.188 1.188 0 112.376 0 1.188 1.188 0 01-2.376 0zM12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <WalletButton />
      </div>
    </nav>
  );
}
