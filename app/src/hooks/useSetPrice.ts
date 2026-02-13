"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";
import { getGlobalStatePda, getPriceFeedPda } from "@/lib/pdas";
import { resolveTimeoutSignature } from "@/lib/confirm";
import BN from "bn.js";

export function useSetPrice() {
  const { connection } = useConnection();
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
            globalState: getGlobalStatePda(),
            priceFeed: getPriceFeedPda(),
          } as any)
          .rpc();
        return tx;
      } catch (err) {
        const resolved = await resolveTimeoutSignature(connection, err);
        if (resolved) return resolved;
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [connection, program, wallet],
  );

  return { setPrice, loading };
}
