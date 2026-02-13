use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::constants::*;
use crate::errors::PerpsError;
use crate::state::{GlobalState, UserVault};

pub fn handle_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, PerpsError::ZeroAmount);

    let vault = &ctx.accounts.user_vault;
    let available = vault
        .deposited_amount
        .checked_sub(vault.locked_margin)
        .ok_or(PerpsError::MathOverflow)?;
    require!(amount <= available, PerpsError::InsufficientBalance);

    // Transfer USDC from treasury to user (PDA signer)
    let seeds = &[GLOBAL_STATE_SEED, &[ctx.accounts.global_state.bump]];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.treasury.to_account_info(),
        to: ctx.accounts.user_ata.to_account_info(),
        authority: ctx.accounts.global_state.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, amount)?;

    // Update vault
    let vault = &mut ctx.accounts.user_vault;
    vault.deposited_amount = vault
        .deposited_amount
        .checked_sub(amount)
        .ok_or(PerpsError::MathOverflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        token::mint = global_state.usdc_mint,
        token::authority = user,
    )]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_VAULT_SEED, user.key().as_ref()],
        bump = user_vault.bump,
        constraint = user_vault.owner == user.key() @ PerpsError::Unauthorized,
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
}
