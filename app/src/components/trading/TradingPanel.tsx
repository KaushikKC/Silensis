"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { OrderForm } from "./OrderForm";
import type { Direction } from "@/types";

interface TradingPanelProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function TradingPanel({ onSuccess, onError }: TradingPanelProps) {
  const [direction, setDirection] = useState<Direction>("long");

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Trade</h3>

      {/* Direction Tabs */}
      <div className="relative flex bg-input-bg rounded-xl p-1 mb-5">
        <motion.div
          className={`absolute top-1 bottom-1 rounded-lg ${
            direction === "long" ? "bg-long" : "bg-short"
          }`}
          style={{ width: "calc(50% - 4px)" }}
          animate={{ x: direction === "long" ? 0 : "calc(100% + 4px)" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
        <button
          onClick={() => setDirection("long")}
          className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            direction === "long" ? "text-white" : "text-gray-500"
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setDirection("short")}
          className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            direction === "short" ? "text-white" : "text-gray-500"
          }`}
        >
          Short
        </button>
      </div>

      <OrderForm direction={direction} onSuccess={onSuccess} onError={onError} />
    </Card>
  );
}
