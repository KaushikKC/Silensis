"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BN from "bn.js";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAllPositions } from "@/hooks/useAllPositions";
import type { PositionWithKey } from "@/hooks/useAllPositions";
import { usePriceFeed } from "@/hooks/usePriceFeed";
import { useLiquidate } from "@/hooks/useLiquidate";
import {
  calculatePnl,
  calculateMarginRatio,
  calculateLiquidationPrice,
  priceToNumber,
  sizeToNumber,
  usdcToNumber,
  leverageToNumber,
} from "@/lib/calculations";
import { formatUsd, formatNumber, shortenAddress } from "@/lib/formatting";
import { parseTransactionError } from "@/lib/errors";
import { getDirection } from "@/types";
import { MAINTENANCE_MARGIN_PCT } from "@/lib/constants";

interface LiquidationPanelProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function LiquidationPanel({ onSuccess, onError }: LiquidationPanelProps) {
  const { positions, loading, refetch } = useAllPositions();
  const { priceFeed } = usePriceFeed();
  const { liquidate } = useLiquidate();
  const [liquidatingId, setLiquidatingId] = useState<string | null>(null);

  const currentPrice = priceFeed?.price || new BN(0);

  // Sort positions by margin ratio (lowest first — most at-risk on top)
  const sortedPositions = [...positions].sort((a, b) => {
    const dirA = getDirection(a.account.direction);
    const dirB = getDirection(b.account.direction);
    const ratioA = calculateMarginRatio(dirA, a.account.entryPrice, currentPrice, a.account.size, a.account.margin);
    const ratioB = calculateMarginRatio(dirB, b.account.entryPrice, currentPrice, b.account.size, b.account.margin);
    return ratioA - ratioB;
  });

  const handleLiquidate = async (pos: PositionWithKey) => {
    setLiquidatingId(pos.publicKey.toBase58());
    try {
      await liquidate(pos.publicKey, pos.account.owner);
      onSuccess();
      refetch();
    } catch (err: any) {
      onError(parseTransactionError(err));
    } finally {
      setLiquidatingId(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Liquidations
        </h3>
        {sortedPositions.length > 0 && (
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {sortedPositions.length} positions
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : sortedPositions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No open positions to monitor
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {sortedPositions.map((pos) => {
              const dir = getDirection(pos.account.direction);
              const marginRatio = calculateMarginRatio(
                dir,
                pos.account.entryPrice,
                currentPrice,
                pos.account.size,
                pos.account.margin
              );
              const isLiquidatable = marginRatio < MAINTENANCE_MARGIN_PCT;
              const liqPrice = calculateLiquidationPrice(
                dir,
                pos.account.entryPrice,
                pos.account.margin,
                pos.account.size
              );
              const pnl = calculatePnl(dir, pos.account.entryPrice, currentPrice, pos.account.size);
              const size = sizeToNumber(pos.account.size);
              const lev = leverageToNumber(pos.account.leverage);

              return (
                <motion.div
                  key={pos.publicKey.toBase58()}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`rounded-xl border p-3 ${
                    isLiquidatable
                      ? "border-red-200 bg-red-50/50"
                      : marginRatio < MAINTENANCE_MARGIN_PCT * 2
                      ? "border-yellow-200 bg-yellow-50/30"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={dir === "long" ? "long" : "short"}>
                        {dir.toUpperCase()} {lev}x
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {shortenAddress(pos.account.owner.toBase58())}
                      </span>
                    </div>
                    {isLiquidatable && (
                      <Button
                        variant="short"
                        size="sm"
                        loading={liquidatingId === pos.publicKey.toBase58()}
                        onClick={() => handleLiquidate(pos)}
                      >
                        Liquidate
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Size</span>
                      <p className="font-medium tabular-nums">{formatNumber(size, 4)} SOL</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Liq. Price</span>
                      <p className="font-medium tabular-nums text-yellow-600">{formatUsd(liqPrice)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Margin Ratio</span>
                      <p
                        className={`font-semibold tabular-nums ${
                          isLiquidatable
                            ? "text-short"
                            : marginRatio < MAINTENANCE_MARGIN_PCT * 2
                            ? "text-yellow-600"
                            : "text-long"
                        }`}
                      >
                        {marginRatio.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Positions below {MAINTENANCE_MARGIN_PCT}% margin ratio can be liquidated.
          Liquidators earn a 0.5% fee.
        </p>
      </div>
    </Card>
  );
}
