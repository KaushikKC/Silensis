"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";

export function useApplyFunding() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const applyFunding = useCallback(async (): Promise<string> => {
    if (!wallet) throw new Error("Wallet not connected");

    setLoading(true);
    try {
      const tx = await program.methods
        .applyFunding()
        .accounts({
          caller: wallet.publicKey,
        } as any)
        .rpc();
      return tx;
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  return { applyFunding, loading };
}
