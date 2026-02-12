import BN from "bn.js";
import { PRICE_DECIMALS, SIZE_DECIMALS, USDC_DECIMALS } from "./constants";

const PRICE_SCALE = 10 ** PRICE_DECIMALS; // 1e6
const SIZE_SCALE = 10 ** SIZE_DECIMALS;   // 1e9
const USDC_SCALE = 10 ** USDC_DECIMALS;   // 1e6

// PnL: mirrors on-chain math
// Long:  pnl = (current - entry) * size / SIZE_PRECISION
// Short: pnl = (entry - current) * size / SIZE_PRECISION
// Result is in PRICE_PRECISION (6 decimals, i.e. USDC)
export function calculatePnl(
  direction: "long" | "short",
  entryPrice: BN,
  currentPrice: BN,
  size: BN
): number {
  const entry = entryPrice.toNumber();
  const current = currentPrice.toNumber();
  const sizeVal = size.toNumber();

  let rawPnl: number;
  if (direction === "long") {
    rawPnl = ((current - entry) * sizeVal) / SIZE_SCALE;
  } else {
    rawPnl = ((entry - current) * sizeVal) / SIZE_SCALE;
  }
  // rawPnl is in PRICE_PRECISION units, convert to dollars
  return rawPnl / PRICE_SCALE;
}

// Margin required: notional / leverage
// notional = size * price / SIZE_PRECISION (result in PRICE_PRECISION = USDC)
// margin = notional / leverage (raw integer)
export function calculateMarginRequired(
  size: number,
  leverage: number,
  price: number
): number {
  // size in SOL, price in USD, leverage raw int -> result in USD
  return (size * price) / leverage;
}

// Convert on-chain price (6 decimal BN) to human-readable number
export function priceToNumber(price: BN): number {
  return price.toNumber() / PRICE_SCALE;
}

// Convert on-chain USDC amount (6 decimal BN) to human-readable number
export function usdcToNumber(amount: BN): number {
  return amount.toNumber() / USDC_SCALE;
}

// Convert on-chain size (9 decimal BN) to human-readable SOL number
export function sizeToNumber(size: BN): number {
  return size.toNumber() / SIZE_SCALE;
}

// Human SOL number -> on-chain size BN (9 decimals)
export function numberToSizeBn(amount: number): BN {
  return new BN(Math.floor(amount * SIZE_SCALE));
}

// Human USD number -> on-chain USDC BN (6 decimals)
export function numberToUsdcBn(amount: number): BN {
  return new BN(Math.floor(amount * USDC_SCALE));
}

// Human USD number -> on-chain price BN (6 decimals)
export function numberToPriceBn(amount: number): BN {
  return new BN(Math.floor(amount * PRICE_SCALE));
}

// Leverage is a raw integer on-chain (10 = 10x)
export function leverageToNumber(leverage: BN): number {
  return leverage.toNumber();
}

export function numberToLeverageBn(leverage: number): BN {
  return new BN(leverage);
}

// Liquidation price calculation — mirrors on-chain math:
// Long:  liq_price = entry_price - (margin * SIZE_PRECISION / size)
// Short: liq_price = entry_price + (margin * SIZE_PRECISION / size)
// All inputs are on-chain BN values; returns human-readable USD number.
export function calculateLiquidationPrice(
  direction: "long" | "short",
  entryPrice: BN,
  margin: BN,
  size: BN
): number {
  const entry = entryPrice.toNumber();
  const marginVal = margin.toNumber();
  const sizeVal = size.toNumber();

  if (sizeVal === 0) return 0;

  const marginPerUnit = (marginVal * SIZE_SCALE) / sizeVal;

  if (direction === "long") {
    return Math.max(0, entry - marginPerUnit) / PRICE_SCALE;
  } else {
    return (entry + marginPerUnit) / PRICE_SCALE;
  }
}

// Margin ratio in basis points — mirrors on-chain calculate_margin_ratio:
// margin_ratio = (margin + pnl) * 10000 / notional
// notional = size * currentPrice / SIZE_PRECISION
// Returns percentage (e.g. 5.0 for 5%)
export function calculateMarginRatio(
  direction: "long" | "short",
  entryPrice: BN,
  currentPrice: BN,
  size: BN,
  margin: BN
): number {
  const pnlUsd = calculatePnl(direction, entryPrice, currentPrice, size);
  const marginUsd = usdcToNumber(margin);
  const effectiveMargin = marginUsd + pnlUsd;

  if (effectiveMargin <= 0) return 0;

  const sizeVal = size.toNumber();
  const price = currentPrice.toNumber();
  const notional = (sizeVal * price) / SIZE_SCALE / PRICE_SCALE;

  if (notional === 0) return 0;

  return (effectiveMargin / notional) * 100;
}

// Funding rate calculation — mirrors on-chain:
// rate = (longOI - shortOI) / (longOI + shortOI)
// Returns as a percentage. Positive = longs pay shorts.
export function calculateFundingRate(longOi: BN, shortOi: BN): number {
  const long = longOi.toNumber();
  const short = shortOi.toNumber();
  const total = long + short;
  if (total === 0) return 0;
  return ((long - short) / total) * 100;
}
