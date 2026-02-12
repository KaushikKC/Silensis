"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useDeposit } from "@/hooks/useDeposit";
import { numberToUsdcBn } from "@/lib/calculations";
import { parseTransactionError } from "@/lib/errors";

interface DepositFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function DepositForm({ onSuccess, onError }: DepositFormProps) {
  const { connected } = useWallet();
  const { deposit, loading } = useDeposit();
  const [amount, setAmount] = useState("");

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      onError("Enter a valid amount");
      return;
    }
    try {
      await deposit(numberToUsdcBn(num));
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
        variant="primary"
        size="md"
        className="w-full"
        loading={loading}
        disabled={!connected || !amount}
        onClick={handleSubmit}
      >
        Deposit
      </Button>
    </div>
  );
}
