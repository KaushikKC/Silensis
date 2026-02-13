# Silensis

A perpetual futures DEX on Solana. Traders can take leveraged long/short positions on SOL/USD using USDC as collateral.

## Architecture

```
┌─────────────────────────────────────────┐
│              Silensis                  │
├──────────┬──────────┬───────────────────┤
│  Vault   │ Position │    Liquidation    │
│ deposit  │  open    │    liquidate      │
│ withdraw │  close   │    apply_funding  │
├──────────┴──────────┴───────────────────┤
│          GlobalState (PDA)              │
│  OI tracking, funding rates, params    │
├─────────────────────────────────────────┤
│         PriceFeed Oracle (PDA)          │
│     Authority-updatable price feed      │
└─────────────────────────────────────────┘
```

### Key Accounts

- **GlobalState** — Protocol singleton: OI tracking, funding rates, parameters
- **UserVault** — Per-user: deposited USDC balance and locked margin
- **Position** — Per-position: direction, size, entry price, leverage, margin
- **PriceFeed** — Oracle price, updatable by authority

### Instructions

| Instruction | Description |
|---|---|
| `initialize` | Create protocol state, treasury, and price feed |
| `set_price` | Update oracle price (authority only) |
| `deposit` | Deposit USDC collateral into user vault |
| `withdraw` | Withdraw available (unlocked) USDC |
| `open_position` | Open a leveraged long/short position |
| `close_position` | Close position, settle PnL |
| `liquidate` | Liquidate underwater position (callable by anyone) |
| `apply_funding` | Apply funding rate based on OI imbalance |

### Protocol Parameters

- Max leverage: 50x
- Maintenance margin: 5% (500 bps)
- Liquidation fee: 0.5% (50 bps)
- Oracle staleness: 30 seconds
- Funding interval: 1 hour

## Build

```bash
anchor build
```

## Test

```bash
anchor test
```

## License

MIT
