import type { Connection } from "@solana/web3.js";
import { TransactionExpiredTimeoutError } from "@solana/web3.js";

/**
 * If the error is a confirmation timeout, check whether the transaction
 * actually landed. If it did, return the signature so the caller can treat it as success.
 */
export async function resolveTimeoutSignature(
  connection: Connection,
  error: unknown,
): Promise<string | null> {
  if (!(error instanceof TransactionExpiredTimeoutError) || !error.signature) {
    return null;
  }
  try {
    const { value } = await connection.getSignatureStatus(error.signature, {
      searchTransactionHistory: true,
    });
    if (
      value &&
      value.err == null &&
      (value.confirmationStatus === "confirmed" ||
        value.confirmationStatus === "finalized" ||
        value.confirmationStatus === "processed")
    ) {
      return error.signature;
    }
  } catch {
    // ignore RPC errors; caller will rethrow original error
  }
  return null;
}
