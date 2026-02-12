use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PerpsError;
use crate::state::{Direction, GlobalState, PriceFeed, Position, UserVault};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OpenPositionParams {
    pub direction: Direction,
    pub size: u64,
    pub leverage: u64,
}

pub fn handle_open_position(
    ctx: Context<OpenPosition>,
    params: OpenPositionParams,
) -> Result<()> {
    let global = &ctx.accounts.global_state;
    require!(!global.is_paused, PerpsError::ProtocolPaused);
    require!(params.size > 0, PerpsError::ZeroSize);
    require!(
        params.leverage > 0 && params.leverage <= global.max_leverage,
        PerpsError::InvalidLeverage
    );

    // Get current price from oracle
    let price_feed = &ctx.accounts.price_feed;
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp - price_feed.timestamp <= MAX_ORACLE_STALENESS,
        PerpsError::OracleStale
    );
    require!(price_feed.price > 0, PerpsError::OracleInvalidPrice);
    let current_price = price_feed.price;

    // Calculate notional value and required margin
    // notional = size * price / SIZE_PRECISION
    let notional = (params.size as u128)
        .checked_mul(current_price as u128)
        .ok_or(PerpsError::MathOverflow)?
        .checked_div(SIZE_PRECISION as u128)
        .ok_or(PerpsError::MathOverflow)? as u64;

    let required_margin = notional
        .checked_div(params.leverage)
        .ok_or(PerpsError::MathOverflow)?;

    // Check available balance
    let vault = &ctx.accounts.user_vault;
    let available = vault
        .deposited_amount
        .checked_sub(vault.locked_margin)
        .ok_or(PerpsError::MathOverflow)?;
    require!(required_margin <= available, PerpsError::InsufficientMargin);

    // Create position
    let position = &mut ctx.accounts.position;
    let global = &mut ctx.accounts.global_state;

    position.owner = ctx.accounts.user.key();
    position.position_id = global.next_position_id;
    position.direction = params.direction;
    position.size = params.size;
    position.entry_price = current_price;
    position.leverage = params.leverage;
    position.margin = required_margin;
    position.last_funding_time = clock.unix_timestamp;
    position.cumulative_funding = 0;
    position.is_open = true;
    position.bump = ctx.bumps.position;

    // Lock margin in vault
    let vault = &mut ctx.accounts.user_vault;
    vault.locked_margin = vault
        .locked_margin
        .checked_add(required_margin)
        .ok_or(PerpsError::MathOverflow)?;

    // Update open interest
    match params.direction {
        Direction::Long => {
            global.total_long_oi = global
                .total_long_oi
                .checked_add(notional)
                .ok_or(PerpsError::MathOverflow)?;
        }
        Direction::Short => {
            global.total_short_oi = global
                .total_short_oi
                .checked_add(notional)
                .ok_or(PerpsError::MathOverflow)?;
        }
    }

    global.next_position_id = global
        .next_position_id
        .checked_add(1)
        .ok_or(PerpsError::MathOverflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
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
        init,
        payer = user,
        space = Position::LEN,
        seeds = [POSITION_SEED, user.key().as_ref(), global_state.next_position_id.to_le_bytes().as_ref()],
        bump,
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

    pub system_program: Program<'info, System>,
}
