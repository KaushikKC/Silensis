"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/Card";
import { BalanceCard } from "./BalanceCard";
import { DepositForm } from "./DepositForm";
import { WithdrawForm } from "./WithdrawForm";

type Tab = "deposit" | "withdraw";

interface AccountPanelProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function AccountPanel({ onSuccess, onError }: AccountPanelProps) {
  const { connected } = useWallet();
  const [tab, setTab] = useState<Tab>("deposit");

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Account</h3>

      {!connected ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Connect wallet to view account
        </p>
      ) : (
        <div className="space-y-5">
          <BalanceCard />

          <div className="border-t border-gray-100 pt-4">
            {/* Tab switcher */}
            <div className="relative flex bg-input-bg rounded-xl p-1 mb-4">
              <motion.div
                className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm"
                style={{ width: "calc(50% - 4px)" }}
                animate={{ x: tab === "deposit" ? 0 : "calc(100% + 4px)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              <button
                onClick={() => setTab("deposit")}
                className={`relative z-10 flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  tab === "deposit" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setTab("withdraw")}
                className={`relative z-10 flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  tab === "withdraw" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Withdraw
              </button>
            </div>

            {tab === "deposit" ? (
              <DepositForm onSuccess={onSuccess} onError={onError} />
            ) : (
              <WithdrawForm onSuccess={onSuccess} onError={onError} />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
