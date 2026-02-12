"use client";

import { useState, useEffect, useCallback } from "react";
import { useProgram } from "./useProgram";
import { getPriceFeedPda } from "@/lib/pdas";
import { POLL_PRICE_MS } from "@/lib/constants";
import type { PriceFeedAccount } from "@/types";

export function usePriceFeed() {
  const { program } = useProgram();
  const [priceFeed, setPriceFeed] = useState<PriceFeedAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const pda = getPriceFeedPda();
      const account = await program.account.priceFeed.fetch(pda);
      setPriceFeed(account as unknown as PriceFeedAccount);
    } catch {
      // Account may not exist yet
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, POLL_PRICE_MS);
    return () => clearInterval(interval);
  }, [fetch]);

  return { priceFeed, loading, refetch: fetch };
}
