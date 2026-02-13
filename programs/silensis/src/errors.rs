use anchor_lang::prelude::*;

#[error_code]
pub enum PerpsError {
    #[msg("Insufficient margin for this position")]
    InsufficientMargin,
    #[msg("Maximum leverage exceeded")]
    MaxLeverageExceeded,
    #[msg("Oracle price is stale")]
    OracleStale,
    #[msg("Oracle price is invalid")]
    OracleInvalidPrice,
    #[msg("Position is not liquidatable")]
    PositionNotLiquidatable,
    #[msg("Position is not open")]
    PositionNotOpen,
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("Insufficient balance for withdrawal")]
    InsufficientBalance,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid parameter")]
    InvalidParameter,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Funding interval not elapsed")]
    FundingIntervalNotElapsed,
    #[msg("Invalid leverage value")]
    InvalidLeverage,
    #[msg("Position size must be greater than zero")]
    ZeroSize,
    #[msg("Withdrawal amount must be greater than zero")]
    ZeroAmount,
}
