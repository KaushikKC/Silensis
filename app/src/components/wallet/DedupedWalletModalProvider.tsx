"use client";

import { WalletModalContext } from "@solana/wallet-adapter-react-ui";
import React, { useState } from "react";
import { DedupedWalletModal } from "./DedupedWalletModal";

/**
 * Same as WalletModalProvider but renders DedupedWalletModal to avoid
 * "two children with the same key" when multiple adapters share a name (e.g. MetaMask).
 */
export function DedupedWalletModalProvider({
  children,
  ...modalProps
}: {
  children: React.ReactNode;
  className?: string;
  container?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      {visible && <DedupedWalletModal {...modalProps} />}
    </WalletModalContext.Provider>
  );
}
