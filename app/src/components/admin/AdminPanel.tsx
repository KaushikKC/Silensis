"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSetPrice } from "@/hooks/useSetPrice";
import { usePriceFeed } from "@/hooks/usePriceFeed";
import { useGlobalState } from "@/hooks/useGlobalState";
import { numberToPriceBn, priceToNumber } from "@/lib/calculations";
import { parseTransactionError } from "@/lib/errors";

interface AdminPanelProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function AdminPanel({ onSuccess, onError }: AdminPanelProps) {
  const { connected, publicKey } = useWallet();
  const { setPrice, loading } = useSetPrice();
  const { priceFeed, refetch: refetchPrice } = usePriceFeed();
  const { globalState } = useGlobalState();

  const [price, setLocalPrice] = useState("100");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if connected wallet is the authority
  const isAuthority =
    connected &&
    publicKey &&
    globalState &&
    publicKey.toBase58() === globalState.authority.toBase58();

  const handleSetPrice = async () => {
    const num = parseFloat(price);
    if (!num || num <= 0) {
      onError("Enter a valid price");
      return;
    }
    try {
      await setPrice(numberToPriceBn(num));
      refetchPrice();
      onSuccess();
    } catch (err: any) {
      onError(parseTransactionError(err));
    }
  };

  // Auto-refresh: re-send setPrice every 15s to avoid staleness
  useEffect(() => {
    if (autoRefresh) {
      const num = parseFloat(price);
      if (!num) return;

      intervalRef.current = setInterval(async () => {
        try {
          await setPrice(numberToPriceBn(num));
          refetchPrice();
        } catch {
          // silently retry on next interval
        }
      }, 15_000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [autoRefresh, price, setPrice, refetchPrice]);

  if (!connected) return null;

  // Only show to authority wallet
  if (globalState && !isAuthority) return null;

  const staleness = priceFeed
    ? Math.floor(Date.now() / 1000) - priceFeed.timestamp.toNumber()
    : null;

  return (
    <Card className="p-5 border-accent/20 bg-accent-muted/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <h3 className="text-sm font-semibold text-text-primary">
          Admin — Oracle
        </h3>
      </div>

      {staleness !== null && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-text-secondary">Price age:</span>
          <span
            className={`text-xs font-semibold ${
              staleness > 25
                ? "text-short"
                : staleness > 15
                ? "text-amber-600"
                : "text-long"
            }`}
          >
            {staleness}s
          </span>
          {staleness > 25 && (
            <span className="text-xs text-short font-medium">
              (STALE — txs will fail)
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Input
          label="SOL Price (USD)"
          type="number"
          placeholder="100.00"
          suffix="USD"
          value={price}
          onChange={(e) => setLocalPrice(e.target.value)}
        />

        <Button
          variant="primary"
          size="md"
          className="w-full"
          loading={loading}
          disabled={!price}
          onClick={handleSetPrice}
        >
          Update Price
        </Button>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-xs text-text-secondary">
            Auto-refresh every 15s (keeps oracle fresh)
          </span>
        </label>
      </div>
    </Card>
  );
}
