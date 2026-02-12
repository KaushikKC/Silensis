"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, getReadonlyProgram } from "@/lib/anchor";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (wallet) {
      return getProgram(connection, wallet);
    }
    return getReadonlyProgram(connection);
  }, [connection, wallet]);

  return { program, connection, wallet };
}
