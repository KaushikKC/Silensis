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
      <h3 className="text-sm font-semibold text-text-primary mb-4">Account</h3>

      {!connected ? (
        <p className="text-sm text-text-muted text-center py-8">
          Connect wallet to view account
        </p>
      ) : (
        <div className="space-y-5">
          <BalanceCard />

          <div className="border-t border-border-light pt-4">
            {/* Tab switcher */}
            <div className="relative flex bg-input-bg rounded-xl p-1 mb-4 border border-border/50">
              <motion.div
                className="absolute top-1 bottom-1 bg-card rounded-lg shadow-sm border border-border/50"
                style={{ width: "calc(50% - 4px)" }}
                animate={{ x: tab === "deposit" ? 0 : "calc(100% + 4px)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              <button
                onClick={() => setTab("deposit")}
                className={`relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  tab === "deposit"
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setTab("withdraw")}
                className={`relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  tab === "withdraw"
                    ? "text-text-primary"
                    : "text-text-secondary"
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
