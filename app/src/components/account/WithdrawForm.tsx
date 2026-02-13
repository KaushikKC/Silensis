"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWithdraw } from "@/hooks/useWithdraw";
import { numberToUsdcBn } from "@/lib/calculations";
import { parseTransactionError } from "@/lib/errors";

interface WithdrawFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function WithdrawForm({ onSuccess, onError }: WithdrawFormProps) {
  const { connected } = useWallet();
  const { withdraw, loading } = useWithdraw();
  const [amount, setAmount] = useState("");

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      onError("Enter a valid amount");
      return;
    }
    try {
      await withdraw(numberToUsdcBn(num));
      setAmount("");
      onSuccess();
    } catch (err: any) {
      onError(parseTransactionError(err));
    }
  };

  return (
    <div className="space-y-3">
      <Input
        type="number"
        placeholder="0.00"
        suffix="USDC"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button
        variant="ghost"
        size="md"
        className="w-full"
        loading={loading}
        disabled={!connected || !amount}
        onClick={handleSubmit}
      >
        Withdraw
      </Button>
    </div>
  );
}
