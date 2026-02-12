"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";
import { getPositionPda } from "@/lib/pdas";
import { useGlobalState } from "./useGlobalState";
import BN from "bn.js";
import type { Direction } from "@/types";

export function useOpenPosition() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const { globalState } = useGlobalState();
  const [loading, setLoading] = useState(false);

  const openPosition = useCallback(
    async (
      direction: Direction,
      size: BN,
      leverage: BN
    ): Promise<string> => {
      if (!wallet || !globalState) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const positionPda = getPositionPda(
          wallet.publicKey,
          globalState.nextPositionId
        );

        const directionArg =
          direction === "long" ? { long: {} } : { short: {} };

        const tx = await program.methods
          .openPosition({
            direction: directionArg,
            size,
            leverage,
          })
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
    [program, wallet, globalState]
  );

  return { openPosition, loading };
}
