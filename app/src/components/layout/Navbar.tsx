"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100">
            <Image src="/logo.svg" alt="Silensis" width={24} height={24} />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Silensis
          </span>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 text-xs font-semibold ring-1 ring-teal-200/60">
            Localnet
          </span>
        </div>
        <div className="flex items-center">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
