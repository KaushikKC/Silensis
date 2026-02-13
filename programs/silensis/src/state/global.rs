use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub treasury: Pubkey,
    pub total_long_oi: u64,
    pub total_short_oi: u64,
    pub last_funding_time: i64,
    pub cumulative_funding_rate_long: i128,
    pub cumulative_funding_rate_short: i128,
    pub max_leverage: u64,
    pub maintenance_margin_bps: u64,
    pub liquidation_fee_bps: u64,
    pub next_position_id: u64,
    pub is_paused: bool,
    pub bump: u8,
}

impl GlobalState {
    pub const LEN: usize = 8 // discriminator
        + 32  // authority
        + 32  // usdc_mint
        + 32  // treasury
        + 8   // total_long_oi
        + 8   // total_short_oi
        + 8   // last_funding_time
        + 16  // cumulative_funding_rate_long
        + 16  // cumulative_funding_rate_short
        + 8   // max_leverage
        + 8   // maintenance_margin_bps
        + 8   // liquidation_fee_bps
        + 8   // next_position_id
        + 1   // is_paused
        + 1;  // bump
}

#[account]
#[derive(Default)]
pub struct PriceFeed {
    pub authority: Pubkey,
    pub price: u64,        // 6 decimals
    pub timestamp: i64,
    pub bump: u8,
}

impl PriceFeed {
    pub const LEN: usize = 8 // discriminator
        + 32  // authority
        + 8   // price
        + 8   // timestamp
        + 1;  // bump
}
