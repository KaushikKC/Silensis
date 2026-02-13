use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::constants::*;
use crate::state::{GlobalState, PriceFeed};

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    let global = &mut ctx.accounts.global_state;
    global.authority = ctx.accounts.authority.key();
    global.usdc_mint = ctx.accounts.usdc_mint.key();
    global.treasury = ctx.accounts.treasury.key();
    global.total_long_oi = 0;
    global.total_short_oi = 0;
    global.last_funding_time = Clock::get()?.unix_timestamp;
    global.cumulative_funding_rate_long = 0;
    global.cumulative_funding_rate_short = 0;
    global.max_leverage = MAX_LEVERAGE;
    global.maintenance_margin_bps = MAINTENANCE_MARGIN_BPS;
    global.liquidation_fee_bps = LIQUIDATION_FEE_BPS;
    global.next_position_id = 0;
    global.is_paused = false;
    global.bump = ctx.bumps.global_state;

    let price_feed = &mut ctx.accounts.price_feed;
    price_feed.authority = ctx.accounts.authority.key();
    price_feed.price = 0;
    price_feed.timestamp = 0;
    price_feed.bump = ctx.bumps.price_feed;

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = GlobalState::LEN,
        seeds = [GLOBAL_STATE_SEED],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = global_state,
        seeds = [TREASURY_SEED],
        bump,
    )]
    pub treasury: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = PriceFeed::LEN,
        seeds = [PRICE_FEED_SEED],
        bump,
    )]
    pub price_feed: Account<'info, PriceFeed>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
