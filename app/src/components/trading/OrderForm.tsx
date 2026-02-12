"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LeverageSlider } from "./LeverageSlider";
import { useOpenPosition } from "@/hooks/useOpenPosition";
import { usePriceFeed } from "@/hooks/usePriceFeed";
import { useUserVault } from "@/hooks/useUserVault";
import { numberToPriceBn, numberToLeverageBn, priceToNumber, usdcToNumber } from "@/lib/calculations";
import { formatUsd } from "@/lib/formatting";
import type { Direction } from "@/types";

interface OrderFormProps {
  direction: Direction;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function OrderForm({ direction, onSuccess, onError }: OrderFormProps) {
  const { connected } = useWallet();
  const { openPosition, loading } = useOpenPosition();
  const { priceFeed } = usePriceFeed();
  const { vault } = useUserVault();

  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(2);

  const currentPrice = priceFeed ? priceToNumber(priceFeed.price) : 0;
  const availableBalance = vault
    ? usdcToNumber(vault.depositedAmount) - usdcToNumber(vault.lockedMargin)
    : 0;

  const marginRequired = useMemo(() => {
    const sizeNum = parseFloat(size);
    if (!sizeNum || !currentPrice) return 0;
    return (sizeNum * currentPrice) / leverage;
  }, [size, leverage, currentPrice]);

  const handleSubmit = async () => {
    const sizeNum = parseFloat(size);
    if (!sizeNum || sizeNum <= 0) {
      onError("Enter a valid size");
      return;
    }
    if (marginRequired > availableBalance) {
      onError("Insufficient margin");
      return;
    }
    try {
      const sizeBn = numberToPriceBn(sizeNum);
      const leverageBn = numberToLeverageBn(leverage);
      await openPosition(direction, sizeBn, leverageBn);
      setSize("");
      onSuccess();
    } catch (err: any) {
      onError(err.message || "Transaction failed");
    }
  };

  const isLong = direction === "long";

  return (
    <div className="space-y-4">
      <Input
        label="Size (SOL)"
        type="number"
        placeholder="0.00"
        suffix="SOL"
        value={size}
        onChange={(e) => setSize(e.target.value)}
      />

      <LeverageSlider value={leverage} onChange={setLeverage} />

      <div className="bg-input-bg rounded-xl p-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Entry Price</span>
          <span className="font-medium tabular-nums">{formatUsd(currentPrice)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Margin Required</span>
          <span className="font-medium tabular-nums">{formatUsd(marginRequired)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Available</span>
          <span className="font-medium tabular-nums">{formatUsd(availableBalance)}</span>
        </div>
      </div>

      <Button
        variant={isLong ? "long" : "short"}
        size="lg"
        className="w-full"
        loading={loading}
        disabled={!connected || !size}
        onClick={handleSubmit}
      >
        {!connected
          ? "Connect Wallet"
          : isLong
          ? "Open Long"
          : "Open Short"}
      </Button>
    </div>
  );
}
