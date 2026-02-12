"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";
import BN from "bn.js";

export function useSetPrice() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const setPrice = useCallback(
    async (price: BN): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const tx = await program.methods
          .setPrice(price)
          .accounts({
            authority: wallet.publicKey,
          } as any)
          .rpc();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet]
  );

  return { setPrice, loading };
}
