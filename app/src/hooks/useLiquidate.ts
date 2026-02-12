"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { getUserVaultPda } from "@/lib/pdas";

export function useLiquidate() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const liquidate = useCallback(
    async (positionPda: PublicKey, positionOwner: PublicKey): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const liquidatorVault = getUserVaultPda(wallet.publicKey);
        const ownerVault = getUserVaultPda(positionOwner);

        const tx = await program.methods
          .liquidate()
          .accounts({
            liquidator: wallet.publicKey,
            liquidatorVault,
            position: positionPda,
            ownerVault,
          } as any)
          .rpc();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet]
  );

  return { liquidate, loading };
}
