"use client";

import { motion } from "framer-motion";
import BN from "bn.js";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  calculatePnl,
  calculateLiquidationPrice,
  priceToNumber,
  sizeToNumber,
  usdcToNumber,
  leverageToNumber,
} from "@/lib/calculations";
import { formatUsd, formatPnl, formatNumber } from "@/lib/formatting";
import { getDirection } from "@/types";
import type { PositionAccount } from "@/types";

interface PositionRowProps {
  position: PositionAccount;
  currentPrice: BN;
  onClose: (positionId: BN) => void;
  closing: boolean;
}

export function PositionRow({
  position,
  currentPrice,
  onClose,
  closing,
}: PositionRowProps) {
  const dir = getDirection(position.direction);
  const pnl = calculatePnl(
    dir,
    position.entryPrice,
    currentPrice,
    position.size,
  );
  const entry = priceToNumber(position.entryPrice);
  const size = sizeToNumber(position.size);
  const margin = usdcToNumber(position.margin);
  const lev = leverageToNumber(position.leverage);
  const pnlPct = margin > 0 ? (pnl / margin) * 100 : 0;
  const liqPrice = calculateLiquidationPrice(
    dir,
    position.entryPrice,
    position.margin,
    position.size,
  );

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-border-light last:border-0"
    >
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2">
          <Badge variant={dir === "long" ? "long" : "short"}>
            {dir.toUpperCase()}
          </Badge>
          <span className="text-sm font-medium">{lev}x</span>
        </div>
      </td>
      <td className="py-3 px-3 text-sm tabular-nums">
        {formatNumber(size, 4)} SOL
      </td>
      <td className="py-3 px-3 text-sm tabular-nums">{formatUsd(entry)}</td>
      <td className="py-3 px-3 text-sm tabular-nums">{formatUsd(margin)}</td>
      <td className="py-3 px-3 text-sm tabular-nums text-amber-600">
        {formatUsd(liqPrice)}
      </td>
      <td className="py-3 px-3">
        <span
          className={`text-sm font-semibold tabular-nums ${
            pnl >= 0 ? "text-long" : "text-short"
          }`}
        >
          {formatPnl(pnl)} ({pnlPct >= 0 ? "+" : ""}
          {pnlPct.toFixed(1)}%)
        </span>
      </td>
      <td className="py-3 pl-3 text-right">
        <Button
          variant="ghost"
          size="sm"
          className=""
          loading={closing}
          onClick={() => onClose(position.positionId)}
        >
          Close
        </Button>
      </td>
    </motion.tr>
  );
}
