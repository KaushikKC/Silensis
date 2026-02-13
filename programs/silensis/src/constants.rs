pub const PRICE_PRECISION: u64 = 1_000_000; // 6 decimals
pub const SIZE_PRECISION: u64 = 1_000_000_000; // 9 decimals (lamports)
pub const BPS_PRECISION: u64 = 10_000;
pub const MAX_LEVERAGE: u64 = 50;
pub const MAINTENANCE_MARGIN_BPS: u64 = 500; // 5%
pub const LIQUIDATION_FEE_BPS: u64 = 50; // 0.5%
pub const MAX_ORACLE_STALENESS: i64 = 30; // seconds
pub const FUNDING_INTERVAL: i64 = 3600; // 1 hour
pub const FUNDING_RATE_PRECISION: u128 = 1_000_000;

pub const GLOBAL_STATE_SEED: &[u8] = b"global_state";
pub const USER_VAULT_SEED: &[u8] = b"user_vault";
pub const POSITION_SEED: &[u8] = b"position";
pub const TREASURY_SEED: &[u8] = b"treasury";
pub const PRICE_FEED_SEED: &[u8] = b"price_feed";
