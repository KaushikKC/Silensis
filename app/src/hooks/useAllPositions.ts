"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { POLL_USER_MS } from "@/lib/constants";
import type { PositionAccount } from "@/types";

export interface PositionWithKey {
  publicKey: PublicKey;
  account: PositionAccount;
}

export function useAllPositions() {
  const { program } = useProgram();
  const [positions, setPositions] = useState<PositionWithKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const allPositions = await program.account.position.all();
      const open = allPositions
        .filter((p) => (p.account as unknown as PositionAccount).isOpen)
        .map((p) => ({
          publicKey: p.publicKey,
          account: p.account as unknown as PositionAccount,
        }));
      setPositions(open);
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, POLL_USER_MS);
    return () => clearInterval(interval);
  }, [fetch]);

  return { positions, loading, refetch: fetch };
}
