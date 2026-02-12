use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PerpsError;
use crate::state::Direction;

/// Calculate PnL for a position.
/// Returns signed value in USDC (6 decimals).
/// pnl = (current_price - entry_price) * size / SIZE_PRECISION for longs
/// pnl = (entry_price - current_price) * size / SIZE_PRECISION for shorts
pub fn calculate_pnl(
    direction: Direction,
    size: u64,
    entry_price: u64,
    current_price: u64,
) -> Result<i64> {
    let size_128 = size as u128;
    let entry_128 = entry_price as u128;
    let current_128 = current_price as u128;
    let size_precision = SIZE_PRECISION as u128;

    let pnl: i128 = match direction {
        Direction::Long => {
            let diff = current_128 as i128 - entry_128 as i128;
            diff.checked_mul(size_128 as i128)
                .ok_or(PerpsError::MathOverflow)?
                .checked_div(size_precision as i128)
                .ok_or(PerpsError::MathOverflow)?
        }
        Direction::Short => {
            let diff = entry_128 as i128 - current_128 as i128;
            diff.checked_mul(size_128 as i128)
                .ok_or(PerpsError::MathOverflow)?
                .checked_div(size_precision as i128)
                .ok_or(PerpsError::MathOverflow)?
        }
    };

    Ok(pnl as i64)
}

/// Calculate margin ratio in basis points.
/// margin_ratio = (margin + pnl) * BPS_PRECISION / notional_value
/// where notional_value = size * current_price / SIZE_PRECISION
pub fn calculate_margin_ratio(
    margin: u64,
    pnl: i64,
    size: u64,
    current_price: u64,
) -> Result<u64> {
    let effective_margin = if pnl >= 0 {
        (margin as i128)
            .checked_add(pnl as i128)
            .ok_or(PerpsError::MathOverflow)?
    } else {
        (margin as i128)
            .checked_add(pnl as i128)
            .ok_or(PerpsError::MathOverflow)?
    };

    if effective_margin <= 0 {
        return Ok(0);
    }

    let notional = (size as u128)
        .checked_mul(current_price as u128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(SIZE_PRECISION as u128)
        .ok_or(PerpsError::MathOverflow)?;

    if notional == 0 {
        return Ok(0);
    }

    let ratio = (effective_margin as u128)
        .checked_mul(BPS_PRECISION as u128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(notional)
        .ok_or(PerpsError::MathOverflow)?;

    Ok(ratio as u64)
}

/// Calculate the liquidation price for a position.
/// For longs: liq_price = entry_price - (margin * SIZE_PRECISION / size)
/// For shorts: liq_price = entry_price + (margin * SIZE_PRECISION / size)
/// (simplified: at liq_price, margin is fully consumed by loss)
pub fn calculate_liquidation_price(
    direction: Direction,
    entry_price: u64,
    margin: u64,
    size: u64,
) -> Result<u64> {
    let margin_per_unit = (margin as u128)
        .checked_mul(SIZE_PRECISION as u128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(size as u128)
        .ok_or(PerpsError::MathOverflow)?;

    match direction {
        Direction::Long => {
            let liq_price = (entry_price as u128)
                .checked_sub(margin_per_unit)
                .unwrap_or(0);
            Ok(liq_price as u64)
        }
        Direction::Short => {
            let liq_price = (entry_price as u128)
                .checked_add(margin_per_unit)
                .ok_or(PerpsError::MathOverflow)?;
            Ok(liq_price as u64)
        }
    }
}

/// Calculate the funding rate based on open interest imbalance.
/// Positive rate means longs pay shorts.
/// rate = (long_oi - short_oi) * FUNDING_RATE_PRECISION / (long_oi + short_oi)
pub fn calculate_funding_rate(
    long_oi: u64,
    short_oi: u64,
) -> Result<i64> {
    let total_oi = (long_oi as u128)
        .checked_add(short_oi as u128)
        .ok_or(PerpsError::MathOverflow)?;

    if total_oi == 0 {
        return Ok(0);
    }

    let diff = (long_oi as i128) - (short_oi as i128);

    let rate = diff
        .checked_mul(FUNDING_RATE_PRECISION as i128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(total_oi as i128)
        .ok_or(PerpsError::MathOverflow)?;

    Ok(rate as i64)
}

/// Calculate funding payment for a position.
/// payment = size * rate * time_elapsed / (FUNDING_INTERVAL * SIZE_PRECISION)
/// Positive means position pays, negative means position receives.
pub fn calculate_funding_payment(
    size: u64,
    direction: Direction,
    rate: i64,
    time_elapsed: i64,
) -> Result<i64> {
    if rate == 0 || time_elapsed == 0 {
        return Ok(0);
    }

    let signed_rate = match direction {
        Direction::Long => rate as i128,      // longs pay when rate > 0
        Direction::Short => -(rate as i128),  // shorts receive when rate > 0
    };

    let payment = (size as i128)
        .checked_mul(signed_rate)
        .ok_or(PerpsError::MathOverflow)?
        .checked_mul(time_elapsed as i128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(
            (FUNDING_INTERVAL as i128)
                .checked_mul(FUNDING_RATE_PRECISION as i128)
                .ok_or(PerpsError::MathOverflow)?,
        )
        .ok_or(PerpsError::MathOverflow)?;

    Ok(payment as i64)
}
