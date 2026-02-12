"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";
import { POLL_USER_MS } from "@/lib/constants";
import type { PositionAccount } from "@/types";

export function usePositions() {
  const { program, connection } = useProgram();
  const wallet = useAnchorWallet();
  const [positions, setPositions] = useState<PositionAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!wallet) {
      setPositions([]);
      setLoading(false);
      return;
    }
    try {
      const allPositions = await program.account.position.all([
        {
          memcmp: {
            offset: 8, // after discriminator
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);
      const open = allPositions
        .map((p) => p.account as unknown as PositionAccount)
        .filter((p) => p.isOpen);
      setPositions(open);
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [program, wallet, connection]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, POLL_USER_MS);
    return () => clearInterval(interval);
  }, [fetch]);

  return { positions, loading, refetch: fetch };
}
