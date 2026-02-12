use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum Direction {
    #[default]
    Long,
    Short,
}

#[account]
#[derive(Default)]
pub struct Position {
    pub owner: Pubkey,
    pub position_id: u64,
    pub direction: Direction,
    pub size: u64,       // base asset units (lamport precision)
    pub entry_price: u64, // 6 decimals
    pub leverage: u64,
    pub margin: u64,     // USDC amount
    pub last_funding_time: i64,
    pub cumulative_funding: i64,
    pub is_open: bool,
    pub bump: u8,
}

impl Position {
    pub const LEN: usize = 8  // discriminator
        + 32  // owner
        + 8   // position_id
        + 1   // direction
        + 8   // size
        + 8   // entry_price
        + 8   // leverage
        + 8   // margin
        + 8   // last_funding_time
        + 8   // cumulative_funding
        + 1   // is_open
        + 1;  // bump
}
