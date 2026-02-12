"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useApplyFunding } from "@/hooks/useApplyFunding";
import { calculateFundingRate, priceToNumber } from "@/lib/calculations";
import { formatNumber } from "@/lib/formatting";
import { parseTransactionError } from "@/lib/errors";
import { FUNDING_INTERVAL_SECS } from "@/lib/constants";

interface FundingPanelProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function FundingPanel({ onSuccess, onError }: FundingPanelProps) {
  const { connected } = useWallet();
  const { globalState, loading, refetch } = useGlobalState();
  const { applyFunding, loading: applying } = useApplyFunding();
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Tick the clock every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-5 flex items-center justify-center min-h-[140px]">
        <Spinner />
      </Card>
    );
  }

  if (!globalState) {
    return (
      <Card className="p-5">
        <p className="text-sm text-gray-400 text-center">Protocol not initialized</p>
      </Card>
    );
  }

  const longOi = priceToNumber(globalState.totalLongOi);
  const shortOi = priceToNumber(globalState.totalShortOi);
  const fundingRate = calculateFundingRate(globalState.totalLongOi, globalState.totalShortOi);
  const lastFundingTime = globalState.lastFundingTime.toNumber();
  const nextFundingTime = lastFundingTime + FUNDING_INTERVAL_SECS;
  const timeUntilFunding = Math.max(0, nextFundingTime - now);
  const canApply = timeUntilFunding === 0 && (longOi + shortOi) > 0;

  const minutes = Math.floor(timeUntilFunding / 60);
  const seconds = timeUntilFunding % 60;

  const handleApplyFunding = async () => {
    try {
      await applyFunding();
      onSuccess();
      refetch();
    } catch (err: any) {
      onError(parseTransactionError(err));
    }
  };

  // Cumulative funding rates (stored as i128 on-chain, divided by FUNDING_RATE_PRECISION = 1e6)
  const cumulativeLong = globalState.cumulativeFundingRateLong.toNumber() / 1_000_000;
  const cumulativeShort = globalState.cumulativeFundingRateShort.toNumber() / 1_000_000;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Funding Rate</h3>

      <div className="space-y-2">
        {/* Current Rate */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-500">Current Rate</span>
          <span
            className={`text-sm font-semibold tabular-nums ${
              fundingRate > 0
                ? "text-short"
                : fundingRate < 0
                ? "text-long"
                : "text-gray-900"
            }`}
          >
            {fundingRate > 0 ? "+" : ""}
            {formatNumber(fundingRate, 4)}%
          </span>
        </div>

        {/* Direction indicator */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Flow</span>
          <span className="text-xs font-medium text-gray-600">
            {fundingRate > 0
              ? "Longs pay Shorts"
              : fundingRate < 0
              ? "Shorts pay Longs"
              : "Balanced"}
          </span>
        </div>

        {/* Cumulative funding */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Cum. Long</span>
          <span className="text-sm font-medium tabular-nums">
            {formatNumber(cumulativeLong * 100, 4)}%
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Cum. Short</span>
          <span className="text-sm font-medium tabular-nums">
            {formatNumber(cumulativeShort * 100, 4)}%
          </span>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Next Funding</span>
          <span
            className={`text-sm font-semibold tabular-nums ${
              canApply ? "text-long" : "text-gray-900"
            }`}
          >
            {canApply ? "Ready" : `${minutes}m ${seconds.toString().padStart(2, "0")}s`}
          </span>
        </div>
      </div>

      {/* Apply Button */}
      <div className="mt-4">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          loading={applying}
          disabled={!connected || !canApply}
          onClick={handleApplyFunding}
        >
          {!connected
            ? "Connect Wallet"
            : canApply
            ? "Apply Funding"
            : "Waiting for Interval"}
        </Button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Anyone can trigger funding once per hour.
          {fundingRate > 0
            ? " Longs will be charged."
            : fundingRate < 0
            ? " Shorts will be charged."
            : ""}
        </p>
      </div>
    </Card>
  );
}
