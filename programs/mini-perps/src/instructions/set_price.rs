use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PerpsError;
use crate::state::{GlobalState, PriceFeed};

pub fn handle_set_price(ctx: Context<SetPrice>, price: u64) -> Result<()> {
    require!(price > 0, PerpsError::InvalidParameter);

    let price_feed = &mut ctx.accounts.price_feed;
    price_feed.price = price;
    price_feed.timestamp = Clock::get()?.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
pub struct SetPrice<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = authority @ PerpsError::Unauthorized,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [PRICE_FEED_SEED],
        bump = price_feed.bump,
    )]
    pub price_feed: Account<'info, PriceFeed>,
}
