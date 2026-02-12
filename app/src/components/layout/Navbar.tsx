"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Mini-Perps" width={32} height={32} />
          <span className="text-lg font-bold text-gray-900">Mini-Perps</span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-accent text-xs font-semibold">
            Localnet
          </span>
        </div>
        <WalletMultiButton />
      </div>
    </header>
  );
}
