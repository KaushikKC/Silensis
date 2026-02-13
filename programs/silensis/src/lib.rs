use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod math;
pub mod state;

use instructions::*;

declare_id!("AY4EDSxDQXhx5neK8ygEuZY1ogE8JkeTVjpUNSwhyJep");

#[program]
pub mod silensis {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handle_initialize(ctx)
    }

    pub fn set_price(ctx: Context<SetPrice>, price: u64) -> Result<()> {
        instructions::set_price::handle_set_price(ctx, price)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handle_deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handle_withdraw(ctx, amount)
    }

    pub fn open_position(
        ctx: Context<OpenPosition>,
        params: OpenPositionParams,
    ) -> Result<()> {
        instructions::open_position::handle_open_position(ctx, params)
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        instructions::close_position::handle_close_position(ctx)
    }

    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        instructions::liquidate::handle_liquidate(ctx)
    }

    pub fn apply_funding(ctx: Context<ApplyFunding>) -> Result<()> {
        instructions::apply_funding::handle_apply_funding(ctx)
    }
}
