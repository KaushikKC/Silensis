"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useProgram } from "./useProgram";
import {
  getUserVaultPda,
  getGlobalStatePda,
  getTreasuryPda,
} from "@/lib/pdas";
import { useGlobalState } from "./useGlobalState";
import BN from "bn.js";

export function useDeposit() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const { globalState } = useGlobalState();
  const [loading, setLoading] = useState(false);

  const deposit = useCallback(
    async (amount: BN): Promise<string> => {
      if (!wallet || !globalState) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const userAta = await getAssociatedTokenAddress(
          globalState.usdcMint,
          wallet.publicKey
        );
        const tx = await program.methods
          .deposit(amount)
          .accounts({
            user: wallet.publicKey,
            userAta,
            userVault: getUserVaultPda(wallet.publicKey),
            globalState: getGlobalStatePda(),
            treasury: getTreasuryPda(),
          })
          .rpc();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, globalState]
  );

  return { deposit, loading };
}
