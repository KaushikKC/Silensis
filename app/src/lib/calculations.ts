import BN from "bn.js";
import { PRICE_DECIMALS, USDC_DECIMALS } from "./constants";

const PRICE_SCALE = new BN(10).pow(new BN(PRICE_DECIMALS));
const USDC_SCALE = new BN(10).pow(new BN(USDC_DECIMALS));

export function calculatePnl(
  direction: "long" | "short",
  entryPrice: BN,
  currentPrice: BN,
  size: BN
): number {
  const entry = entryPrice.toNumber() / 10 ** PRICE_DECIMALS;
  const current = currentPrice.toNumber() / 10 ** PRICE_DECIMALS;
  const sizeVal = size.toNumber() / 10 ** PRICE_DECIMALS;

  if (direction === "long") {
    return (current - entry) * sizeVal;
  }
  return (entry - current) * sizeVal;
}

export function calculateMarginRequired(
  size: BN,
  leverage: BN,
  price: BN
): number {
  const sizeNum = size.toNumber() / 10 ** PRICE_DECIMALS;
  const leverageNum = leverage.toNumber() / 100; // leverage stored as e.g. 200 for 2x
  const priceNum = price.toNumber() / 10 ** PRICE_DECIMALS;
  return (sizeNum * priceNum) / leverageNum;
}

export function calculateLiquidationPrice(
  direction: "long" | "short",
  entryPrice: BN,
  leverage: BN,
  maintenanceMarginBps: number
): number {
  const entry = entryPrice.toNumber() / 10 ** PRICE_DECIMALS;
  const lev = leverage.toNumber() / 100;
  const mmr = maintenanceMarginBps / 10_000;

  if (direction === "long") {
    return entry * (1 - (1 - mmr) / lev);
  }
  return entry * (1 + (1 - mmr) / lev);
}

export function priceToNumber(price: BN): number {
  return price.toNumber() / 10 ** PRICE_DECIMALS;
}

export function usdcToNumber(amount: BN): number {
  return amount.toNumber() / 10 ** USDC_DECIMALS;
}

export function numberToUsdcBn(amount: number): BN {
  return new BN(Math.floor(amount * 10 ** USDC_DECIMALS));
}

export function numberToPriceBn(amount: number): BN {
  return new BN(Math.floor(amount * 10 ** PRICE_DECIMALS));
}

export function leverageToNumber(leverage: BN): number {
  return leverage.toNumber() / 100;
}

export function numberToLeverageBn(leverage: number): BN {
  return new BN(Math.floor(leverage * 100));
}
