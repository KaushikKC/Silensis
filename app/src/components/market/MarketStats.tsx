"use client";

import { useGlobalState } from "@/hooks/useGlobalState";
import { priceToNumber, calculateFundingRate } from "@/lib/calculations";
import { formatUsd, formatNumber } from "@/lib/formatting";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface StatRowProps {
  label: string;
  value: string;
  color?: string;
}

function StatRow({ label, value, color }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color || "text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}

export function MarketStats() {
  const { globalState, loading } = useGlobalState();

  if (loading) {
    return (
      <Card className="p-5 flex items-center justify-center min-h-[200px]">
        <Spinner />
      </Card>
    );
  }

  if (!globalState) {
    return (
      <Card className="p-5">
        <p className="text-sm text-gray-400 text-center">
          Protocol not initialized
        </p>
      </Card>
    );
  }

  const longOi = priceToNumber(globalState.totalLongOi);
  const shortOi = priceToNumber(globalState.totalShortOi);
  const maxLev = globalState.maxLeverage.toNumber();
  const fundingRate = calculateFundingRate(globalState.totalLongOi, globalState.totalShortOi);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Market Stats</h3>
      <div className="divide-y divide-gray-100">
        <StatRow label="Long OI" value={formatUsd(longOi)} color="text-long" />
        <StatRow label="Short OI" value={formatUsd(shortOi)} color="text-short" />
        <StatRow
          label="OI Ratio"
          value={
            longOi + shortOi > 0
              ? `${formatNumber((longOi / (longOi + shortOi)) * 100, 1)}% L`
              : "—"
          }
        />
        <StatRow
          label="Funding Rate"
          value={`${fundingRate > 0 ? "+" : ""}${formatNumber(fundingRate, 4)}%`}
          color={fundingRate > 0 ? "text-short" : fundingRate < 0 ? "text-long" : undefined}
        />
        <StatRow label="Max Leverage" value={`${maxLev}x`} />
        <StatRow
          label="Maint. Margin"
          value={`${globalState.maintenanceMarginBps.toNumber() / 100}%`}
        />
        <StatRow
          label="Status"
          value={globalState.isPaused ? "Paused" : "Active"}
          color={globalState.isPaused ? "text-short" : "text-long"}
        />
      </div>
    </Card>
  );
}
