"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Markets", href: "/market/list", icon: "M3 3h18v18H3z" }, // Square (placeholder)
    { label: "Portfolio", href: "/portfolio", icon: "M12 2l10 18H2L12 2z" }, // Triangle
    { label: "Funds", href: "/fund", icon: "M12 2a10 10 0 100 20 10 10 0 000-20z" }, // Circle
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/' ? 'text-blue-600' : 'text-gray-400'}`}>
             <span className="text-xl font-bold">🏠</span>
             <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
        </Link>
        
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {/* Simple geometric icons using text/emoji for simplicity in this demo */}
              <span className="text-xl font-bold">
                  {item.label === 'Markets' ? '📊' : item.label === 'Portfolio' ? '💼' : '💰'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
