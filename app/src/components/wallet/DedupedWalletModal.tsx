"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal, WalletIcon, WalletSVG } from "@solana/wallet-adapter-react-ui";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/**
 * Wallet modal that deduplicates wallets by adapter name (first wins).
 * Fixes "Encountered two children with the same key" when Wallet Standard
 * registers the same wallet twice (e.g. MetaMask).
 */
export function DedupedWalletModal({
  className = "",
  container = "body",
}: {
  className?: string;
  container?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { wallets, select } = useWallet();
  const { setVisible } = useWalletModal();
  const [expanded, setExpanded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [portal, setPortal] = useState<Element | null>(null);

  const uniqueWallets = useMemo(() => {
    const seen = new Set<string>();
    return wallets.filter((w) => {
      const name = w.adapter.name;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [wallets]);

  const [listedWallets, collapsedWallets] = useMemo(() => {
    const installed: typeof uniqueWallets = [];
    const notInstalled: typeof uniqueWallets = [];
    for (const wallet of uniqueWallets) {
      if (wallet.readyState === WalletReadyState.Installed) {
        installed.push(wallet);
      } else {
        notInstalled.push(wallet);
      }
    }
    return installed.length
      ? [installed, notInstalled]
      : [notInstalled, []];
  }, [uniqueWallets]);

  const hideModal = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => setVisible(false), 150);
  }, [setVisible]);

  const handleClose = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      hideModal();
    },
    [hideModal]
  );

  const handleWalletClick = useCallback(
    (_event: React.MouseEvent, walletName: string) => {
      select(walletName);
      hideModal();
    },
    [select, hideModal]
  );

  const handleCollapseClick = useCallback(() => setExpanded((e) => !e), []);

  const handleTabKey = useCallback((event: React.KeyboardEvent) => {
    const node = ref.current;
    if (!node) return;
    const focusableElements = node.querySelectorAll<HTMLElement>("button");
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first && last) {
        last.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === last && first) {
        first.focus();
        event.preventDefault();
      }
    }
  }, []);

  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hideModal();
      else if (event.key === "Tab") handleTabKey(event as unknown as React.KeyboardEvent);
    };
    const { overflow } = window.getComputedStyle(document.body);
    setTimeout(() => setFadeIn(true), 0);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown, false);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [hideModal, handleTabKey]);

  useLayoutEffect(() => {
    setPortal(document.querySelector(container));
  }, [container]);

  const renderWalletList = (list: typeof uniqueWallets, tabIndex: number) => (
    <ul className="wallet-adapter-modal-list">
      {list.map((wallet) => (
        <li key={wallet.adapter.name}>
          <button
            type="button"
            className="wallet-adapter-button"
            onClick={(e) => handleWalletClick(e, wallet.adapter.name)}
            tabIndex={tabIndex}
          >
            <i className="wallet-adapter-button-start-icon">
              <WalletIcon wallet={wallet} />
            </i>
            {wallet.adapter.name}
            {wallet.readyState === WalletReadyState.Installed && (
              <span> Detected</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );

  if (!portal) return null;

  return createPortal(
    <div
      aria-labelledby="wallet-adapter-modal-title"
      aria-modal="true"
      className={`wallet-adapter-modal ${fadeIn ? "wallet-adapter-modal-fade-in" : ""} ${className}`}
      ref={ref}
      role="dialog"
    >
      <div className="wallet-adapter-modal-container">
        <div className="wallet-adapter-modal-wrapper">
          <button
            type="button"
            onClick={handleClose}
            className="wallet-adapter-modal-button-close"
            aria-label="Close"
          >
            <svg width="14" height="14">
              <path d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z" />
            </svg>
          </button>
          {listedWallets.length > 0 ? (
            <>
              <h1 id="wallet-adapter-modal-title" className="wallet-adapter-modal-title">
                Connect a wallet on Solana to continue
              </h1>
              {renderWalletList(listedWallets, 0)}
              {collapsedWallets.length > 0 && (
                <>
                  <button
                    type="button"
                    className="wallet-adapter-modal-list-more"
                    onClick={handleCollapseClick}
                    tabIndex={0}
                  >
                    <span>{expanded ? "Less " : "More "}options</span>
                    <svg width="13" height="7" viewBox="0 0 13 7" className={expanded ? "wallet-adapter-modal-list-more-icon-rotate" : ""}>
                      <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                    </svg>
                  </button>
                  {expanded && renderWalletList(collapsedWallets, 0)}
                </>
              )}
            </>
          ) : (
            <>
              <h1 id="wallet-adapter-modal-title" className="wallet-adapter-modal-title">
                You&apos;ll need a wallet on Solana to continue
              </h1>
              <div className="wallet-adapter-modal-middle">
                <WalletSVG />
              </div>
              {collapsedWallets.length > 0 && (
                <>
                  <button
                    type="button"
                    className="wallet-adapter-modal-list-more"
                    onClick={handleCollapseClick}
                    tabIndex={0}
                  >
                    <span>{expanded ? "Hide " : "Already have a wallet? View "}options</span>
                    <svg width="13" height="7" viewBox="0 0 13 7" className={expanded ? "wallet-adapter-modal-list-more-icon-rotate" : ""}>
                      <path d="M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                    </svg>
                  </button>
                  {expanded && renderWalletList(collapsedWallets, 0)}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div
        className="wallet-adapter-modal-overlay"
        onMouseDown={handleClose}
        role="presentation"
      />
    </div>,
    portal
  );
}
