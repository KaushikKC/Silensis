import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "ErsZC2zCgRDTHH83C7Bg8Xi9sr47jE5gGNzCdsqfKsK2"
);

export const CLUSTER_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8899";

export const PRICE_DECIMALS = 9;
export const USDC_DECIMALS = 6;
export const LEVERAGE_DECIMALS = 2;

export const POLL_PRICE_MS = 2_000;
export const POLL_GLOBAL_MS = 5_000;
export const POLL_USER_MS = 10_000;

export const MAX_LEVERAGE = 10;
export const MIN_LEVERAGE = 1;

export const SEEDS = {
  GLOBAL_STATE: "global_state",
  PRICE_FEED: "price_feed",
  USER_VAULT: "user_vault",
  TREASURY: "treasury",
  POSITION: "position",
} as const;
