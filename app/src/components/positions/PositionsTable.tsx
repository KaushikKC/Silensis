"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import BN from "bn.js";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PositionRow } from "./PositionRow";
import { usePositions } from "@/hooks/usePositions";
import { usePriceFeed } from "@/hooks/usePriceFeed";
import { useClosePosition } from "@/hooks/useClosePosition";
import { parseTransactionError } from "@/lib/errors";

interface PositionsTableProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function PositionsTable({ onSuccess, onError }: PositionsTableProps) {
  const { positions, loading, refetch } = usePositions();
  const { priceFeed } = usePriceFeed();
  const { closePosition } = useClosePosition();
  const [closingId, setClosingId] = useState<string | null>(null);

  const handleClose = async (positionId: BN) => {
    setClosingId(positionId.toString());
    try {
      await closePosition(positionId);
      onSuccess();
      refetch();
    } catch (err: any) {
      onError(parseTransactionError(err));
    } finally {
      setClosingId(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Open Positions
        </h3>
        {positions.length > 0 && (
          <span className="text-xs font-semibold text-text-secondary bg-border-light px-2.5 py-1 rounded-full">
            {positions.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : positions.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">
          No open positions
        </p>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left text-xs font-semibold text-text-secondary pb-2 pr-3">
                  Side
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary pb-2 px-3">
                  Size
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary pb-2 px-3">
                  Entry
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary pb-2 px-3">
                  Margin
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary pb-2 px-3">
                  Liq. Price
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary pb-2 px-3">
                  PnL
                </th>
                <th className="pb-2 pl-3"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {positions.map((pos) => (
                  <PositionRow
                    key={pos.positionId.toString()}
                    position={pos}
                    currentPrice={priceFeed?.price || new BN(0)}
                    onClose={handleClose}
                    closing={closingId === pos.positionId.toString()}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
