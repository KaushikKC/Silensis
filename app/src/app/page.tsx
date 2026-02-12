"use client";

import { useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PriceHeader } from "@/components/market/PriceHeader";
import { MarketStats } from "@/components/market/MarketStats";
import { TradingPanel } from "@/components/trading/TradingPanel";
import { AccountPanel } from "@/components/account/AccountPanel";
import { PositionsTable } from "@/components/positions/PositionsTable";
import { ToastContainer } from "@/components/ui/Toast";
import type { Toast } from "@/types";

export default function Home() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSuccess = useCallback(() => {
    addToast("success", "Transaction confirmed");
  }, [addToast]);

  const handleError = useCallback(
    (msg: string) => {
      addToast("error", msg);
    },
    [addToast]
  );

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column — Price + Market Stats */}
          <div className="lg:col-span-3 space-y-5">
            <PriceHeader />
            <MarketStats />
          </div>

          {/* Center Column — Trading + Positions */}
          <div className="lg:col-span-5 space-y-5">
            <TradingPanel onSuccess={handleSuccess} onError={handleError} />
            <PositionsTable onSuccess={handleSuccess} onError={handleError} />
          </div>

          {/* Right Column — Account */}
          <div className="lg:col-span-4 space-y-5">
            <AccountPanel onSuccess={handleSuccess} onError={handleError} />
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
