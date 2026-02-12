"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";
import { getUserVaultPda } from "@/lib/pdas";
import { POLL_USER_MS } from "@/lib/constants";
import type { UserVaultAccount } from "@/types";

export function useUserVault() {
  const { program } = useProgram();
  const wallet = useAnchorWallet();
  const [vault, setVault] = useState<UserVaultAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!wallet) {
      setVault(null);
      setLoading(false);
      return;
    }
    try {
      const pda = getUserVaultPda(wallet.publicKey);
      const account = await program.account.userVault.fetch(pda);
      setVault(account as unknown as UserVaultAccount);
    } catch {
      setVault(null);
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, POLL_USER_MS);
    return () => clearInterval(interval);
  }, [fetch]);

  return { vault, loading, refetch: fetch };
}
