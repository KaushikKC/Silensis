use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::constants::*;
use crate::errors::PerpsError;
use crate::state::{GlobalState, UserVault};

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, PerpsError::ZeroAmount);

    // Transfer USDC from user to treasury
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_ata.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // Update vault
    let vault = &mut ctx.accounts.user_vault;
    vault.owner = ctx.accounts.user.key();
    vault.deposited_amount = vault
        .deposited_amount
        .checked_add(amount)
        .ok_or(PerpsError::MathOverflow)?;
    vault.bump = ctx.bumps.user_vault;

    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        token::mint = global_state.usdc_mint,
        token::authority = user,
    )]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserVault::LEN,
        seeds = [USER_VAULT_SEED, user.key().as_ref()],
        bump,
    )]
    pub user_vault: Account<'info, UserVault>,

    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump,
        token::mint = global_state.usdc_mint,
        token::authority = global_state,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
