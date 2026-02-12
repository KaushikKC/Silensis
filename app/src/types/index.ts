import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export type Direction = "long" | "short";

export interface GlobalStateAccount {
  authority: PublicKey;
  usdcMint: PublicKey;
  treasury: PublicKey;
  totalLongOi: BN;
  totalShortOi: BN;
  lastFundingTime: BN;
  cumulativeFundingRateLong: BN;
  cumulativeFundingRateShort: BN;
  maxLeverage: BN;
  maintenanceMarginBps: BN;
  liquidationFeeBps: BN;
  nextPositionId: BN;
  isPaused: boolean;
  bump: number;
}

export interface PriceFeedAccount {
  authority: PublicKey;
  price: BN;
  timestamp: BN;
  bump: number;
}

export interface UserVaultAccount {
  owner: PublicKey;
  depositedAmount: BN;
  lockedMargin: BN;
  bump: number;
}

export interface PositionAccount {
  owner: PublicKey;
  positionId: BN;
  direction: { long: {} } | { short: {} };
  size: BN;
  entryPrice: BN;
  leverage: BN;
  margin: BN;
  lastFundingTime: BN;
  cumulativeFunding: BN;
  isOpen: boolean;
  bump: number;
}

export function getDirection(dir: { long: {} } | { short: {} }): Direction {
  return "long" in dir ? "long" : "short";
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
