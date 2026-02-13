use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PerpsError;
use crate::math::{calculate_margin_ratio, calculate_pnl};
use crate::state::{Direction, GlobalState, PriceFeed, Position, UserVault};

pub fn handle_liquidate(ctx: Context<Liquidate>) -> Result<()> {
    let position = &ctx.accounts.position;
    require!(position.is_open, PerpsError::PositionNotOpen);

    // Get current price from oracle
    let price_feed = &ctx.accounts.price_feed;
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp - price_feed.timestamp <= MAX_ORACLE_STALENESS,
        PerpsError::OracleStale
    );
    require!(price_feed.price > 0, PerpsError::OracleInvalidPrice);
    let current_price = price_feed.price;

    // Calculate PnL and margin ratio
    let pnl = calculate_pnl(
        position.direction,
        position.size,
        position.entry_price,
        current_price,
    )?;

    let margin_ratio = calculate_margin_ratio(
        position.margin,
        pnl,
        position.size,
        current_price,
    )?;

    // Position must be below maintenance margin
    let global = &ctx.accounts.global_state;
    require!(
        margin_ratio < global.maintenance_margin_bps,
        PerpsError::PositionNotLiquidatable
    );

    let margin = position.margin;

    // Calculate liquidation fee
    let liq_fee = (margin as u128)
        .checked_mul(global.liquidation_fee_bps as u128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(BPS_PRECISION as u128)
        .ok_or(PerpsError::MathOverflow)? as u64;

    // Calculate notional for OI update
    let notional = (position.size as u128)
        .checked_mul(position.entry_price as u128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(SIZE_PRECISION as u128)
        .ok_or(PerpsError::MathOverflow)? as u64;

    // Effective margin after PnL
    let effective_margin = if pnl >= 0 {
        margin
            .checked_add(pnl as u64)
            .ok_or(PerpsError::MathOverflow)?
    } else {
        margin.saturating_sub((-pnl) as u64)
    };

    // Remaining margin after liquidation fee goes back to position owner
    let remaining = effective_margin.saturating_sub(liq_fee);

    // Update owner vault: unlock margin and adjust balance
    let owner_vault = &mut ctx.accounts.owner_vault;
    owner_vault.locked_margin = owner_vault
        .locked_margin
        .checked_sub(margin)
        .ok_or(PerpsError::MathOverflow)?;

    // Owner gets remaining after fee; adjust deposited_amount
    // deposited_amount was originally = X, locked_margin had `margin` locked
    // Now: unlocked, but the position lost value. New deposited = deposited - margin + remaining
    if remaining >= margin {
        owner_vault.deposited_amount = owner_vault
            .deposited_amount
            .checked_add(remaining - margin)
            .ok_or(PerpsError::MathOverflow)?;
    } else {
        owner_vault.deposited_amount = owner_vault
            .deposited_amount
            .saturating_sub(margin - remaining);
    }

    // Award liquidation fee to liquidator
    let liquidator_vault = &mut ctx.accounts.liquidator_vault;
    liquidator_vault.owner = ctx.accounts.liquidator.key();
    liquidator_vault.deposited_amount = liquidator_vault
        .deposited_amount
        .checked_add(liq_fee)
        .ok_or(PerpsError::MathOverflow)?;

    // Update global state open interest
    let global = &mut ctx.accounts.global_state;
    match position.direction {
        Direction::Long => {
            global.total_long_oi = global.total_long_oi.saturating_sub(notional);
        }
        Direction::Short => {
            global.total_short_oi = global.total_short_oi.saturating_sub(notional);
        }
    }

    // Mark position as closed
    let position = &mut ctx.accounts.position;
    position.is_open = false;

    msg!(
        "Position {} liquidated. Fee: {}, Remaining: {}",
        position.position_id,
        liq_fee,
        remaining
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(
        init_if_needed,
        payer = liquidator,
        space = UserVault::LEN,
        seeds = [USER_VAULT_SEED, liquidator.key().as_ref()],
        bump,
    )]
    pub liquidator_vault: Account<'info, UserVault>,

    #[account(
        mut,
        constraint = position.is_open @ PerpsError::PositionNotOpen,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [USER_VAULT_SEED, position.owner.as_ref()],
        bump = owner_vault.bump,
    )]
    pub owner_vault: Account<'info, UserVault>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        seeds = [PRICE_FEED_SEED],
        bump = price_feed.bump,
    )]
    pub price_feed: Account<'info, PriceFeed>,

    pub system_program: Program<'info, System>,
}
