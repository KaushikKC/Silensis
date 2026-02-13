import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "AY4EDSxDQXhx5neK8ygEuZY1ogE8JkeTVjpUNSwhyJep",
);

export const CLUSTER_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8899";

// On-chain precision matches the program constants:
// PRICE_PRECISION = 1_000_000 (6 decimals) — prices, balances, margin, OI
// SIZE_PRECISION = 1_000_000_000 (9 decimals) — position sizes (SOL lamports)
export const PRICE_DECIMALS = 6;
export const SIZE_DECIMALS = 9;
export const USDC_DECIMALS = 6;

export const POLL_PRICE_MS = 2_000;
export const POLL_GLOBAL_MS = 5_000;
export const POLL_USER_MS = 10_000;

// Leverage is a raw integer on-chain (10 = 10x)
export const MAX_LEVERAGE = 50;
export const MIN_LEVERAGE = 1;

export const MAINTENANCE_MARGIN_PCT = 5; // 5% = 500 bps
export const LIQUIDATION_FEE_PCT = 0.5; // 0.5% = 50 bps
export const FUNDING_INTERVAL_SECS = 3600; // 1 hour

export const SEEDS = {
  GLOBAL_STATE: "global_state",
  PRICE_FEED: "price_feed",
  USER_VAULT: "user_vault",
  TREASURY: "treasury",
  POSITION: "position",
} as const;
