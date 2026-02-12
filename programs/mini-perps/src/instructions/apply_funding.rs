use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PerpsError;
use crate::math::calculate_funding_rate;
use crate::state::{GlobalState, PriceFeed};

pub fn handle_apply_funding(ctx: Context<ApplyFunding>) -> Result<()> {
    let clock = Clock::get()?;
    let global = &ctx.accounts.global_state;

    let time_elapsed = clock
        .unix_timestamp
        .checked_sub(global.last_funding_time)
        .ok_or(PerpsError::MathOverflow)?;

    require!(
        time_elapsed >= FUNDING_INTERVAL,
        PerpsError::FundingIntervalNotElapsed
    );

    // Get current price from oracle
    let price_feed = &ctx.accounts.price_feed;
    require!(
        clock.unix_timestamp - price_feed.timestamp <= MAX_ORACLE_STALENESS,
        PerpsError::OracleStale
    );
    require!(price_feed.price > 0, PerpsError::OracleInvalidPrice);

    // Calculate funding rate based on OI imbalance
    let funding_rate = calculate_funding_rate(global.total_long_oi, global.total_short_oi)?;

    // Update cumulative funding rates
    let global = &mut ctx.accounts.global_state;
    global.cumulative_funding_rate_long = global
        .cumulative_funding_rate_long
        .checked_add(funding_rate as i128)
        .ok_or(PerpsError::MathOverflow)?;
    global.cumulative_funding_rate_short = global
        .cumulative_funding_rate_short
        .checked_sub(funding_rate as i128)
        .ok_or(PerpsError::MathOverflow)?;

    global.last_funding_time = clock.unix_timestamp;

    msg!(
        "Funding applied. Rate: {}, Long OI: {}, Short OI: {}",
        funding_rate,
        global.total_long_oi,
        global.total_short_oi
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ApplyFunding<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

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
