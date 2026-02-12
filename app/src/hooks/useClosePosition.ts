"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";
import { getPositionPda } from "@/lib/pdas";
import BN from "bn.js";

export function useClosePosition() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const closePosition = useCallback(
    async (positionId: BN): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const positionPda = getPositionPda(wallet.publicKey, positionId);

        const tx = await program.methods
          .closePosition()
          .accounts({
            user: wallet.publicKey,
            position: positionPda,
          } as any)
          .rpc();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet]
  );

  return { closePosition, loading };
}
