use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserVault {
    pub owner: Pubkey,
    pub deposited_amount: u64,
    pub locked_margin: u64,
    pub bump: u8,
}

impl UserVault {
    pub const LEN: usize = 8 // discriminator
        + 32  // owner
        + 8   // deposited_amount
        + 8   // locked_margin
        + 1;  // bump
}
