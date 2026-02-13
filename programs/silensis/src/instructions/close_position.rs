use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PerpsError;
use crate::math::calculate_pnl;
use crate::state::{Direction, GlobalState, PriceFeed, Position, UserVault};

pub fn handle_close_position(ctx: Context<ClosePosition>) -> Result<()> {
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

    // Calculate PnL
    let pnl = calculate_pnl(
        position.direction,
        position.size,
        position.entry_price,
        current_price,
    )?;

    let margin = position.margin;

    // Calculate notional for OI update
    let notional = (position.size as u128)
        .checked_mul(position.entry_price as u128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(SIZE_PRECISION as u128)
        .ok_or(PerpsError::MathOverflow)? as u64;

    // Settle: new_balance = margin + pnl (clamped to 0 minimum)
    let settlement = if pnl >= 0 {
        margin
            .checked_add(pnl as u64)
            .ok_or(PerpsError::MathOverflow)?
    } else {
        let loss = (-pnl) as u64;
        margin.saturating_sub(loss)
    };

    // Update vault: unlock margin and adjust balance
    let vault = &mut ctx.accounts.user_vault;
    vault.locked_margin = vault
        .locked_margin
        .checked_sub(margin)
        .ok_or(PerpsError::MathOverflow)?;

    // Adjust deposited_amount by PnL
    if pnl >= 0 {
        vault.deposited_amount = vault
            .deposited_amount
            .checked_add(pnl as u64)
            .ok_or(PerpsError::MathOverflow)?;
    } else {
        let loss = (-pnl) as u64;
        vault.deposited_amount = vault.deposited_amount.saturating_sub(loss);
    }

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
        "Position {} closed. PnL: {}, Settlement: {}",
        position.position_id,
        pnl,
        settlement
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_VAULT_SEED, user.key().as_ref()],
        bump = user_vault.bump,
        constraint = user_vault.owner == user.key() @ PerpsError::Unauthorized,
    )]
    pub user_vault: Account<'info, UserVault>,

    #[account(
        mut,
        constraint = position.owner == user.key() @ PerpsError::Unauthorized,
        constraint = position.is_open @ PerpsError::PositionNotOpen,
    )]
    pub position: Account<'info, Position>,

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
}
