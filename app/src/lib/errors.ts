// Map Anchor custom error codes to human-readable messages
// Based on the IDL errors array
const ERROR_MAP: Record<number, string> = {
  6000: "Insufficient margin for this position",
  6001: "Maximum leverage exceeded",
  6002: "Oracle price is stale — update the price first",
  6003: "Oracle price is invalid",
  6004: "Position is not liquidatable",
  6005: "Position is not open",
  6006: "Protocol is paused",
  6007: "Insufficient balance for withdrawal",
  6008: "Math overflow — try a smaller amount",
  6009: "Invalid parameter",
  6010: "Unauthorized — only the authority can do this",
  6011: "Funding interval not elapsed yet",
  6012: "Invalid leverage value",
  6013: "Position size must be greater than zero",
  6014: "Withdrawal amount must be greater than zero",
};

/**
 * Extract a human-readable message from an Anchor/Solana transaction error.
 */
export function parseTransactionError(err: any): string {
  // Anchor IDL error
  if (err?.error?.errorCode?.number) {
    const code = err.error.errorCode.number;
    return ERROR_MAP[code] || `Program error ${code}: ${err.error.errorMessage || "Unknown"}`;
  }

  // AnchorError format
  if (err?.errorCode?.number) {
    const code = err.errorCode.number;
    return ERROR_MAP[code] || `Program error ${code}`;
  }

  // Check for error code in message string (e.g. "custom program error: 0x1770")
  const hexMatch = err?.message?.match(/custom program error: 0x([0-9a-fA-F]+)/);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    return ERROR_MAP[code] || `Program error ${code}`;
  }

  // Solana common errors
  const msg = err?.message || String(err);
  if (msg.includes("User rejected")) return "Transaction rejected by wallet";
  if (msg.includes("Blockhash not found")) return "Transaction expired — please try again";
  if (msg.includes("insufficient funds")) return "Insufficient SOL for transaction fee";
  if (msg.includes("AccountNotFound")) return "Account not found — deposit first";

  // Fallback
  return msg.length > 120 ? msg.slice(0, 120) + "..." : msg;
}
