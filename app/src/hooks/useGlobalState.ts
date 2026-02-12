"use client";

import { useState, useEffect, useCallback } from "react";
import { useProgram } from "./useProgram";
import { getGlobalStatePda } from "@/lib/pdas";
import { POLL_GLOBAL_MS } from "@/lib/constants";
import type { GlobalStateAccount } from "@/types";

export function useGlobalState() {
  const { program } = useProgram();
  const [globalState, setGlobalState] = useState<GlobalStateAccount | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const pda = getGlobalStatePda();
      const account = await program.account.globalState.fetch(pda);
      setGlobalState(account as unknown as GlobalStateAccount);
    } catch {
      // Account may not exist yet
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, POLL_GLOBAL_MS);
    return () => clearInterval(interval);
  }, [fetch]);

  return { globalState, loading, refetch: fetch };
}
