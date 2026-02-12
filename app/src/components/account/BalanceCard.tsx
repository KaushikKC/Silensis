"use client";

import { useUserVault } from "@/hooks/useUserVault";
import { usdcToNumber } from "@/lib/calculations";
import { formatUsd } from "@/lib/formatting";

export function BalanceCard() {
  const { vault } = useUserVault();

  const deposited = vault ? usdcToNumber(vault.depositedAmount) : 0;
  const locked = vault ? usdcToNumber(vault.lockedMargin) : 0;
  const available = deposited - locked;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Total Balance</span>
        <span className="text-lg font-bold tabular-nums">{formatUsd(deposited)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Locked Margin</span>
        <span className="text-sm font-semibold text-gray-600 tabular-nums">
          {formatUsd(locked)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Available</span>
        <span className="text-sm font-semibold text-long tabular-nums">
          {formatUsd(available)}
        </span>
      </div>
    </div>
  );
}
