"use client";

import {
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  useLocalStorage,
  WalletContext,
  WalletNotSelectedError,
} from "@solana/wallet-adapter-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Same as WalletProvider but does NOT merge Wallet Standard adapters.
 * Uses only the adapters we pass (Local, Phantom, Solflare).
 * Fixes Phantom "WalletConnectionError: Unexpected error" when the
 * StandardWalletAdapter wrapper fails — we use PhantomWalletAdapter directly.
 */
export function ExplicitAdaptersWalletProvider({
  children,
  wallets: adapters,
  autoConnect = false,
  localStorageKey = "walletName",
  onError,
}: {
  children: React.ReactNode;
  wallets: Adapter[];
  autoConnect?: boolean | ((adapter: Adapter) => Promise<boolean>);
  localStorageKey?: string;
  onError?: (error: WalletError, adapter?: Adapter) => void;
}) {
  const [walletName, setWalletName] = useLocalStorage<string | null>(
    localStorageKey,
    null,
  );
  const adapter = useMemo(
    () => adapters.find((a) => a.name === walletName) ?? null,
    [adapters, walletName],
  );
  const isUnloadingRef = useRef(false);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
    return () => {
      onErrorRef.current = undefined;
    };
  }, [onError]);

  const handleErrorRef = useRef((error: WalletError, a?: Adapter) => {
    if (!isUnloadingRef.current) {
      if (onErrorRef.current) {
        onErrorRef.current(error, a);
      } else {
        console.error(error, a);
        if (
          error instanceof WalletNotReadyError &&
          typeof window !== "undefined" &&
          a
        ) {
          window.open(a.url, "_blank");
        }
      }
    }
    return error;
  });

  const [wallets, setWallets] = useState(() =>
    adapters
      .map((a) => ({ adapter: a, readyState: a.readyState }))
      .filter(({ readyState }) => readyState !== WalletReadyState.Unsupported),
  );

  useEffect(() => {
    setWallets((prev) =>
      adapters
        .map((a, i) => {
          const w = prev[i];
          return w?.adapter === a && w.readyState === a.readyState
            ? w
            : { adapter: a, readyState: a.readyState };
        })
        .filter(
          ({ readyState }) => readyState !== WalletReadyState.Unsupported,
        ),
    );
    const handleReadyStateChange = function (
      this: Adapter,
      readyState: WalletReadyState,
    ) {
      setWallets((prev) => {
        const idx = prev.findIndex(({ adapter: ad }) => ad === this);
        if (idx === -1) return prev;
        const { adapter: ad } = prev[idx];
        return [
          ...prev.slice(0, idx),
          { adapter: ad, readyState },
          ...prev.slice(idx + 1),
        ].filter(({ readyState: rs }) => rs !== WalletReadyState.Unsupported);
      });
    };
    adapters.forEach((a) =>
      a.on("readyStateChange", handleReadyStateChange, a),
    );
    return () => {
      adapters.forEach((a) =>
        a.off("readyStateChange", handleReadyStateChange, a),
      );
    };
  }, [adapter, adapters]);

  const wallet = useMemo(
    () => wallets.find((w) => w.adapter === adapter) ?? null,
    [adapter, wallets],
  );

  const isConnectingRef = useRef(false);
  const [connecting, setConnecting] = useState(false);
  const isDisconnectingRef = useRef(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [publicKey, setPublicKey] = useState(() => adapter?.publicKey ?? null);
  const [connected, setConnected] = useState(() => !!adapter?.connected);

  useEffect(() => {
    if (!adapter) {
      setPublicKey(null);
      setConnected(false);
      return;
    }
    setPublicKey(adapter.publicKey);
    setConnected(adapter.connected);
    const handleConnect = (pk: typeof publicKey) => {
      setPublicKey(pk);
      isConnectingRef.current = false;
      setConnecting(false);
      setConnected(true);
      isDisconnectingRef.current = false;
      setDisconnecting(false);
    };
    const handleDisconnect = () => {
      if (!isUnloadingRef.current) {
        setPublicKey(null);
        setConnecting(false);
        setConnected(false);
        setDisconnecting(false);
        setWalletName(null);
      }
    };
    const handleErr = (err: WalletError) => {
      handleErrorRef.current(err, adapter);
    };
    adapter.on("connect", handleConnect);
    adapter.on("disconnect", handleDisconnect);
    adapter.on("error", handleErr);
    return () => {
      adapter.off("connect", handleConnect);
      adapter.off("disconnect", handleDisconnect);
      adapter.off("error", handleErr);
      handleDisconnect();
    };
  }, [adapter, setWalletName]);

  const changeWallet = useCallback(
    (next: string | null) => {
      if (walletName === next) return;
      if (adapter) adapter.disconnect();
      setWalletName(next);
    },
    [adapter, setWalletName, walletName],
  );

  const hasUserSelectedAWallet = useRef(false);
  const handleAutoConnectRequest = useMemo(() => {
    if (!autoConnect || !adapter) return undefined;
    return async () => {
      if (autoConnect === true || (await autoConnect(adapter))) {
        if (hasUserSelectedAWallet.current) {
          await adapter.connect();
        } else {
          await adapter.autoConnect();
        }
      }
    };
  }, [autoConnect, adapter]);

  const didAttemptAutoConnectRef = useRef(false);
  useEffect(() => {
    return () => {
      didAttemptAutoConnectRef.current = false;
    };
  }, [adapter]);

  useEffect(() => {
    if (
      didAttemptAutoConnectRef.current ||
      isConnectingRef.current ||
      connected ||
      !handleAutoConnectRequest ||
      !(
        wallet?.readyState === WalletReadyState.Installed ||
        wallet?.readyState === WalletReadyState.Loadable
      )
    )
      return;
    isConnectingRef.current = true;
    setConnecting(true);
    didAttemptAutoConnectRef.current = true;
    (async () => {
      try {
        await handleAutoConnectRequest();
      } catch {
        changeWallet(null);
      } finally {
        setConnecting(false);
        isConnectingRef.current = false;
      }
    })();
  }, [connected, handleAutoConnectRequest, changeWallet, wallet]);

  const handleConnectError = useCallback(() => {
    if (adapter) changeWallet(null);
  }, [adapter, changeWallet]);

  const selectWallet = useCallback(
    (name: string | null) => {
      hasUserSelectedAWallet.current = true;
      changeWallet(name);
    },
    [changeWallet],
  );

  const sendTransaction = useCallback(
    async (
      transaction: Parameters<Adapter["sendTransaction"]>[0],
      connection: Parameters<Adapter["sendTransaction"]>[1],
      options?: Parameters<Adapter["sendTransaction"]>[2],
    ) => {
      if (!adapter) throw handleErrorRef.current(new WalletNotSelectedError());
      if (!connected)
        throw handleErrorRef.current(new WalletNotConnectedError(), adapter);
      return adapter.sendTransaction(transaction, connection, options);
    },
    [adapter, connected],
  );

  const signTransaction = useMemo(
    () =>
      adapter && "signTransaction" in adapter
        ? async (transaction: unknown) => {
            if (!connected)
              throw handleErrorRef.current(
                new WalletNotConnectedError(),
                adapter,
              );
            return (
              adapter as { signTransaction: (tx: unknown) => Promise<unknown> }
            ).signTransaction(transaction);
          }
        : undefined,
    [adapter, connected],
  );

  const signAllTransactions = useMemo(
    () =>
      adapter && "signAllTransactions" in adapter
        ? async (transactions: unknown[]) => {
            if (!connected)
              throw handleErrorRef.current(
                new WalletNotConnectedError(),
                adapter,
              );
            return (
              adapter as {
                signAllTransactions: (txs: unknown[]) => Promise<unknown[]>;
              }
            ).signAllTransactions(transactions);
          }
        : undefined,
    [adapter, connected],
  );

  const signMessage = useMemo(
    () =>
      adapter && "signMessage" in adapter
        ? async (msg: Uint8Array) => {
            if (!connected)
              throw handleErrorRef.current(
                new WalletNotConnectedError(),
                adapter,
              );
            return (
              adapter as Adapter & {
                signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
              }
            ).signMessage(msg);
          }
        : undefined,
    [adapter, connected],
  );

  const signIn = useMemo(
    () =>
      adapter && "signIn" in adapter
        ? async (input?: unknown) =>
            (
              adapter as Adapter & {
                signIn: (input?: unknown) => Promise<unknown>;
              }
            ).signIn(input)
        : undefined,
    [adapter],
  );

  const connect = useCallback(async () => {
    if (
      isConnectingRef.current ||
      isDisconnectingRef.current ||
      wallet?.adapter.connected
    )
      return;
    if (!wallet) throw handleErrorRef.current(new WalletNotSelectedError());
    const { adapter: ad, readyState } = wallet;
    if (
      readyState !== WalletReadyState.Installed &&
      readyState !== WalletReadyState.Loadable
    )
      throw handleErrorRef.current(new WalletNotReadyError(), ad);
    isConnectingRef.current = true;
    setConnecting(true);
    try {
      await ad.connect();
    } catch (e) {
      handleConnectError();
      throw e;
    } finally {
      setConnecting(false);
      isConnectingRef.current = false;
    }
  }, [handleConnectError, wallet]);

  const disconnect = useCallback(async () => {
    if (isDisconnectingRef.current || !adapter) return;
    isDisconnectingRef.current = true;
    setDisconnecting(true);
    try {
      await adapter.disconnect();
    } finally {
      setDisconnecting(false);
      isDisconnectingRef.current = false;
    }
  }, [adapter]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const value = useMemo(
    (): WalletContextState => ({
      autoConnect: !!handleAutoConnectRequest,
      wallets,
      wallet,
      publicKey,
      connected,
      connecting,
      disconnecting,
      select: selectWallet,
      connect,
      disconnect,
      sendTransaction,
      signTransaction: signTransaction as WalletContextState["signTransaction"],
      signAllTransactions:
        signAllTransactions as WalletContextState["signAllTransactions"],
      signMessage,
      signIn: signIn as WalletContextState["signIn"],
    }),
    [
      handleAutoConnectRequest,
      wallets,
      wallet,
      publicKey,
      connected,
      connecting,
      disconnecting,
      selectWallet,
      connect,
      disconnect,
      sendTransaction,
      signTransaction,
      signAllTransactions,
      signMessage,
      signIn,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
