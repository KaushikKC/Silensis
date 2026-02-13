/**
 * Dev-only wallet adapter that uses a keypair from env.
 * Use for localnet so the frontend uses the same wallet as setup-localnet.ts.
 *
 * In app/.env.local set one of:
 *   NEXT_PUBLIC_LOCAL_KEYPAIR=<base58 from: npx tsx scripts/export-keypair-base58.ts>
 *   NEXT_PUBLIC_LOCAL_KEYPAIR=[1,2,...,64]  (raw JSON from ~/.config/solana/id.json, one line)
 * Never commit this or use on mainnet.
 */

import bs58 from "bs58";
import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import {
  BaseSignerWalletAdapter,
  WalletConfigError,
  type WalletName,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import type { TransactionOrVersionedTransaction } from "@solana/wallet-adapter-base";
import { isVersionedTransaction } from "@solana/wallet-adapter-base";

const NAME = "Local (dev)" as WalletName<"Local (dev)">;

type SupportedVersions = ReadonlySet<0 | "legacy">;

function keypairFromEnv(): Keypair | null {
  const raw = process.env.NEXT_PUBLIC_LOCAL_KEYPAIR;
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed) as number[];
      if (Array.isArray(arr) && arr.length === 64) {
        return Keypair.fromSecretKey(Uint8Array.from(arr));
      }
    } catch {
      return null;
    }
  }
  try {
    const secret = bs58.decode(trimmed);
    if (secret.length !== 64) return null;
    return Keypair.fromSecretKey(secret);
  } catch {
    return null;
  }
}

export class LocalKeypairWalletAdapter extends BaseSignerWalletAdapter<
  typeof NAME
> {
  name = NAME;
  url = "file://local";
  icon =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'><text x='12' y='16' text-anchor='middle' font-size='10'>DEV</text></svg>";
  readyState = WalletReadyState.Loadable;
  publicKey: PublicKey | null = null;
  connecting = false;
  supportedTransactionVersions: SupportedVersions = new Set([0, "legacy"]);

  private _keypair: Keypair | null = null;

  constructor() {
    super();
    this._keypair = typeof window !== "undefined" ? keypairFromEnv() : null;
    if (this._keypair) {
      this.publicKey = this._keypair.publicKey;
    }
  }

  async connect(): Promise<void> {
    if (this.connecting || this.connected) return;
    if (!this._keypair) {
      this.emit(
        "error",
        new WalletConfigError(
          "Local keypair not configured (NEXT_PUBLIC_LOCAL_KEYPAIR)",
        ),
      );
      return;
    }
    this.connecting = true;
    try {
      this.publicKey = this._keypair.publicKey;
      this.emit("connect", this._keypair.publicKey);
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
    this.emit("disconnect");
  }

  async signTransaction<
    T extends TransactionOrVersionedTransaction<SupportedVersions>,
  >(transaction: T): Promise<T> {
    if (!this._keypair) throw new Error("Local keypair not configured");
    if (isVersionedTransaction(transaction)) {
      (transaction as VersionedTransaction).sign([this._keypair]);
    } else {
      (transaction as Transaction).partialSign(this._keypair);
    }
    return transaction;
  }
}
