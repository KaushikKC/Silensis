"use client";

import { useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PriceHeader } from "@/components/market/PriceHeader";
import { MarketStats } from "@/components/market/MarketStats";
import { TradingPanel } from "@/components/trading/TradingPanel";
import { AccountPanel } from "@/components/account/AccountPanel";
import { PositionsTable } from "@/components/positions/PositionsTable";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LiquidationPanel } from "@/components/liquidation/LiquidationPanel";
import { FundingPanel } from "@/components/funding/FundingPanel";
import { ToastContainer } from "@/components/ui/Toast";
import { useUserVault } from "@/hooks/useUserVault";
import { usePositions } from "@/hooks/usePositions";
import { usePriceFeed } from "@/hooks/usePriceFeed";
import { useGlobalState } from "@/hooks/useGlobalState";
import type { Toast } from "@/types";

export default function Home() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Lift data hooks to page level for post-tx refetch
  const vaultHook = useUserVault();
  const positionsHook = usePositions();
  const priceFeedHook = usePriceFeed();
  const globalStateHook = useGlobalState();

  const refetchAll = useCallback(() => {
    vaultHook.refetch();
    positionsHook.refetch();
    priceFeedHook.refetch();
    globalStateHook.refetch();
  }, [vaultHook, positionsHook, priceFeedHook, globalStateHook]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSuccess = useCallback(() => {
    addToast("success", "Transaction confirmed");
    // Immediate refetch after any successful tx
    setTimeout(refetchAll, 500);
  }, [addToast, refetchAll]);

  const handleError = useCallback(
    (msg: string) => {
      addToast("error", msg);
    },
    [addToast],
  );

  return (
    <div className="min-h-screen bg-page text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column — Price + Market Stats + Funding */}
          <div className="lg:col-span-3 space-y-5">
            <PriceHeader />
            <MarketStats />
            <FundingPanel onSuccess={handleSuccess} onError={handleError} />
          </div>

          {/* Center Column — Trading + Positions + Liquidations */}
          <div className="lg:col-span-5 space-y-5">
            <TradingPanel onSuccess={handleSuccess} onError={handleError} />
            <PositionsTable onSuccess={handleSuccess} onError={handleError} />
            <LiquidationPanel onSuccess={handleSuccess} onError={handleError} />
          </div>

          {/* Right Column — Account + Admin */}
          <div className="lg:col-span-4 space-y-5">
            <AccountPanel onSuccess={handleSuccess} onError={handleError} />
            <AdminPanel onSuccess={handleSuccess} onError={handleError} />
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
