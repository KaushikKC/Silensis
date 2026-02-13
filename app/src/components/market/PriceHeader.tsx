"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePriceFeed } from "@/hooks/usePriceFeed";
import { priceToNumber } from "@/lib/calculations";
import { formatUsd } from "@/lib/formatting";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export function PriceHeader() {
  const { priceFeed, loading } = usePriceFeed();

  const price = priceFeed ? priceToNumber(priceFeed.price) : 0;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-long animate-pulse" />
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          SOL / USD
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={price}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="text-3xl font-bold text-text-primary tabular-nums tracking-tight"
          >
            {formatUsd(price)}
          </motion.div>
        </AnimatePresence>
      )}

      {priceFeed && (
        <p className="text-xs text-text-muted mt-1">
          Updated{" "}
          {new Date(priceFeed.timestamp.toNumber() * 1000).toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
}
