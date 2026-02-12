use anchor_lang::prelude::*;

declare_id!("NNKKQChc4oxcMryYtYrZ3bHztZCTNkP9iBVhV2czDiX");

#[program]
pub mod mini_perps_tmp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
