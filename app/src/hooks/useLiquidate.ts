"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { getUserVaultPda, getGlobalStatePda, getPriceFeedPda } from "@/lib/pdas";

export function useLiquidate() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const liquidate = useCallback(
    async (positionPda: PublicKey, positionOwner: PublicKey): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const tx = await program.methods
          .liquidate()
          .accounts({
            liquidator: wallet.publicKey,
            liquidatorVault: getUserVaultPda(wallet.publicKey),
            position: positionPda,
            ownerVault: getUserVaultPda(positionOwner),
            globalState: getGlobalStatePda(),
            priceFeed: getPriceFeedPda(),
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
