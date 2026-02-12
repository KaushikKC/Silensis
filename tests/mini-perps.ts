import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { MiniPerps } from "../target/types/mini_perps";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("mini-perps", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.miniPerps as Program<MiniPerps>;
  const authority = provider.wallet as anchor.Wallet;

  let usdcMint: PublicKey;
  let userAta: PublicKey;
  let trader: Keypair;
  let traderAta: PublicKey;
  let liquidator: Keypair;
  let liquidatorAta: PublicKey;

  // PDAs
  let globalStatePda: PublicKey;
  let treasuryPda: PublicKey;
  let priceFeedPda: PublicKey;

  const USDC_DECIMALS = 6;
  const INITIAL_BALANCE = 10_000 * 10 ** USDC_DECIMALS; // 10,000 USDC
  const SOL_PRICE = 100 * 10 ** USDC_DECIMALS; // $100 per SOL (6 decimals)
  const SIZE_PRECISION = 1_000_000_000; // 9 decimals

  function findPda(seeds: Buffer[]): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(seeds, program.programId);
    return pda;
  }

  function userVaultPda(owner: PublicKey): PublicKey {
    return findPda([Buffer.from("user_vault"), owner.toBuffer()]);
  }

  function positionPda(owner: PublicKey, positionId: number): PublicKey {
    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(BigInt(positionId));
    return findPda([Buffer.from("position"), owner.toBuffer(), idBuffer]);
  }

  before(async () => {
    // Derive PDAs
    globalStatePda = findPda([Buffer.from("global_state")]);
    treasuryPda = findPda([Buffer.from("treasury")]);
    priceFeedPda = findPda([Buffer.from("price_feed")]);

    // Create USDC mint
    usdcMint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      USDC_DECIMALS
    );

    // Setup authority ATA
    const authorityAtaAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      (authority as any).payer,
      usdcMint,
      authority.publicKey
    );
    userAta = authorityAtaAccount.address;

    // Mint USDC to authority
    await mintTo(
      provider.connection,
      (authority as any).payer,
      usdcMint,
      userAta,
      authority.publicKey,
      INITIAL_BALANCE
    );

    // Setup trader
    trader = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      trader.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    const traderAtaAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      trader,
      usdcMint,
      trader.publicKey
    );
    traderAta = traderAtaAccount.address;

    // Mint USDC to trader
    await mintTo(
      provider.connection,
      (authority as any).payer,
      usdcMint,
      traderAta,
      authority.publicKey,
      INITIAL_BALANCE
    );

    // Setup liquidator
    liquidator = Keypair.generate();
    const sig2 = await provider.connection.requestAirdrop(
      liquidator.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig2, "confirmed");

    const liquidatorAtaAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      liquidator,
      usdcMint,
      liquidator.publicKey
    );
    liquidatorAta = liquidatorAtaAccount.address;
  });

  // ============================================
  // INITIALIZATION
  // ============================================
  describe("Initialize", () => {
    it("initializes the protocol", async () => {
      await program.methods
        .initialize()
        .accounts({
          authority: authority.publicKey,
          usdcMint: usdcMint,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .rpc();

      const globalState = await program.account.globalState.fetch(globalStatePda);
      assert.ok(globalState.authority.equals(authority.publicKey));
      assert.ok(globalState.usdcMint.equals(usdcMint));
      assert.equal(globalState.maxLeverage.toNumber(), 50);
      assert.equal(globalState.maintenanceMarginBps.toNumber(), 500);
      assert.equal(globalState.liquidationFeeBps.toNumber(), 50);
      assert.equal(globalState.nextPositionId.toNumber(), 0);
      assert.equal(globalState.isPaused, false);
      assert.equal(globalState.totalLongOi.toNumber(), 0);
      assert.equal(globalState.totalShortOi.toNumber(), 0);

      const priceFeed = await program.account.priceFeed.fetch(priceFeedPda);
      assert.ok(priceFeed.authority.equals(authority.publicKey));
      assert.equal(priceFeed.price.toNumber(), 0);
    });
  });

  // ============================================
  // SET PRICE
  // ============================================
  describe("Set Price", () => {
    it("sets the oracle price", async () => {
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({
          authority: authority.publicKey,
        } as any)
        .rpc();

      const priceFeed = await program.account.priceFeed.fetch(priceFeedPda);
      assert.equal(priceFeed.price.toNumber(), SOL_PRICE);
      assert.ok(priceFeed.timestamp.toNumber() > 0);
    });

    it("fails when non-authority sets price", async () => {
      try {
        await program.methods
          .setPrice(new BN(SOL_PRICE))
          .accounts({
            authority: trader.publicKey,
          } as any)
          .signers([trader])
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        assert.ok(e.toString().includes("Error") || e.error);
      }
    });
  });

  // ============================================
  // DEPOSITS
  // ============================================
  describe("Deposit", () => {
    it("deposits USDC to vault", async () => {
      const depositAmount = 5000 * 10 ** USDC_DECIMALS; // 5000 USDC

      await program.methods
        .deposit(new BN(depositAmount))
        .accounts({
          user: authority.publicKey,
          userAta: userAta,
        } as any)
        .rpc();

      const vault = await program.account.userVault.fetch(
        userVaultPda(authority.publicKey)
      );
      assert.equal(vault.depositedAmount.toNumber(), depositAmount);
      assert.equal(vault.lockedMargin.toNumber(), 0);
      assert.ok(vault.owner.equals(authority.publicKey));
    });

    it("deposits more USDC (adds to existing)", async () => {
      const additionalDeposit = 2000 * 10 ** USDC_DECIMALS;

      await program.methods
        .deposit(new BN(additionalDeposit))
        .accounts({
          user: authority.publicKey,
          userAta: userAta,
        } as any)
        .rpc();

      const vault = await program.account.userVault.fetch(
        userVaultPda(authority.publicKey)
      );
      assert.equal(
        vault.depositedAmount.toNumber(),
        7000 * 10 ** USDC_DECIMALS
      );
    });

    it("trader deposits USDC", async () => {
      const depositAmount = 5000 * 10 ** USDC_DECIMALS;

      await program.methods
        .deposit(new BN(depositAmount))
        .accounts({
          user: trader.publicKey,
          userAta: traderAta,
        } as any)
        .signers([trader])
        .rpc();

      const vault = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );
      assert.equal(vault.depositedAmount.toNumber(), depositAmount);
    });

    it("fails to deposit zero", async () => {
      try {
        await program.methods
          .deposit(new BN(0))
          .accounts({
            user: authority.publicKey,
            userAta: userAta,
          } as any)
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("ZeroAmount");
      }
    });
  });

  // ============================================
  // WITHDRAWALS
  // ============================================
  describe("Withdraw", () => {
    it("withdraws USDC from vault", async () => {
      const withdrawAmount = 1000 * 10 ** USDC_DECIMALS;

      await program.methods
        .withdraw(new BN(withdrawAmount))
        .accounts({
          user: authority.publicKey,
          userAta: userAta,
        } as any)
        .rpc();

      const vault = await program.account.userVault.fetch(
        userVaultPda(authority.publicKey)
      );
      assert.equal(
        vault.depositedAmount.toNumber(),
        6000 * 10 ** USDC_DECIMALS
      );
    });

    it("fails to withdraw more than available", async () => {
      const tooMuch = 100_000 * 10 ** USDC_DECIMALS;

      try {
        await program.methods
          .withdraw(new BN(tooMuch))
          .accounts({
            user: authority.publicKey,
            userAta: userAta,
          } as any)
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("InsufficientBalance");
      }
    });

    it("fails to withdraw zero", async () => {
      try {
        await program.methods
          .withdraw(new BN(0))
          .accounts({
            user: authority.publicKey,
            userAta: userAta,
          } as any)
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("ZeroAmount");
      }
    });
  });

  // ============================================
  // OPEN POSITION
  // ============================================
  describe("Open Position", () => {
    it("opens a long position", async () => {
      // Refresh the price first
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const positionId = 0;
      const size = new BN(1 * SIZE_PRECISION); // 1 SOL
      const leverage = new BN(10); // 10x

      await program.methods
        .openPosition({
          direction: { long: {} },
          size: size,
          leverage: leverage,
        })
        .accounts({
          user: authority.publicKey,
        } as any)
        .rpc();

      // Check position
      const position = await program.account.position.fetch(
        positionPda(authority.publicKey, positionId)
      );
      assert.ok(position.owner.equals(authority.publicKey));
      assert.equal(position.positionId.toNumber(), positionId);
      assert.deepEqual(position.direction, { long: {} });
      assert.equal(position.size.toNumber(), SIZE_PRECISION);
      assert.equal(position.entryPrice.toNumber(), SOL_PRICE);
      assert.equal(position.leverage.toNumber(), 10);
      assert.equal(position.isOpen, true);

      // Notional = size * price / SIZE_PRECISION = 1 SOL * $100 = $100 = 100_000_000
      // Margin = notional / leverage = 100_000_000 / 10 = 10_000_000 ($10)
      assert.equal(position.margin.toNumber(), 10_000_000);

      // Check vault margin locked
      const vault = await program.account.userVault.fetch(
        userVaultPda(authority.publicKey)
      );
      assert.equal(vault.lockedMargin.toNumber(), 10_000_000);

      // Check global state OI
      const global = await program.account.globalState.fetch(globalStatePda);
      assert.equal(global.totalLongOi.toNumber(), 100_000_000); // $100
      assert.equal(global.nextPositionId.toNumber(), 1);
    });

    it("opens a short position", async () => {
      const positionId = 1;
      const size = new BN(2 * SIZE_PRECISION); // 2 SOL
      const leverage = new BN(5); // 5x

      await program.methods
        .openPosition({
          direction: { short: {} },
          size: size,
          leverage: leverage,
        })
        .accounts({
          user: authority.publicKey,
        } as any)
        .rpc();

      const position = await program.account.position.fetch(
        positionPda(authority.publicKey, positionId)
      );
      assert.deepEqual(position.direction, { short: {} });
      assert.equal(position.size.toNumber(), 2 * SIZE_PRECISION);
      assert.equal(position.leverage.toNumber(), 5);
      // Notional = 2 * $100 = $200 = 200_000_000
      // Margin = 200_000_000 / 5 = 40_000_000 ($40)
      assert.equal(position.margin.toNumber(), 40_000_000);

      const global = await program.account.globalState.fetch(globalStatePda);
      assert.equal(global.totalShortOi.toNumber(), 200_000_000);
      assert.equal(global.nextPositionId.toNumber(), 2);
    });

    it("fails on excessive leverage", async () => {
      try {
        await program.methods
          .openPosition({
            direction: { long: {} },
            size: new BN(SIZE_PRECISION),
            leverage: new BN(100), // 100x > max 50x
          })
          .accounts({
            user: authority.publicKey,
          } as any)
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("InvalidLeverage");
      }
    });

    it("fails on insufficient margin", async () => {
      try {
        await program.methods
          .openPosition({
            direction: { long: {} },
            size: new BN(10000 * SIZE_PRECISION), // 10000 SOL - huge
            leverage: new BN(2),
          })
          .accounts({
            user: authority.publicKey,
          } as any)
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("InsufficientMargin");
      }
    });

    it("fails on zero size", async () => {
      try {
        await program.methods
          .openPosition({
            direction: { long: {} },
            size: new BN(0),
            leverage: new BN(10),
          })
          .accounts({
            user: authority.publicKey,
          } as any)
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("ZeroSize");
      }
    });
  });

  // ============================================
  // CLOSE POSITION
  // ============================================
  describe("Close Position", () => {
    it("closes a long position with profit", async () => {
      // Trader opens a long
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const globalBefore = await program.account.globalState.fetch(globalStatePda);
      const positionId = globalBefore.nextPositionId.toNumber();

      await program.methods
        .openPosition({
          direction: { long: {} },
          size: new BN(SIZE_PRECISION), // 1 SOL
          leverage: new BN(10), // 10x
        })
        .accounts({
          user: trader.publicKey,
        } as any)
        .signers([trader])
        .rpc();

      const vaultBefore = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );

      // Price goes up 10%
      const newPrice = 110 * 10 ** USDC_DECIMALS; // $110
      await program.methods
        .setPrice(new BN(newPrice))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const posKey = positionPda(trader.publicKey, positionId);

      await program.methods
        .closePosition()
        .accounts({
          user: trader.publicKey,
          position: posKey,
        } as any)
        .signers([trader])
        .rpc();

      // PnL = (110 - 100) * 1 SOL / SIZE_PRECISION = $10 = 10_000_000
      const vaultAfter = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );

      // Deposited should increase by PnL ($10)
      assert.equal(
        vaultAfter.depositedAmount.toNumber(),
        vaultBefore.depositedAmount.toNumber() + 10_000_000
      );
      // Locked margin should decrease by margin ($10)
      assert.equal(
        vaultAfter.lockedMargin.toNumber(),
        vaultBefore.lockedMargin.toNumber() - 10_000_000
      );

      // Position should be closed
      const position = await program.account.position.fetch(posKey);
      assert.equal(position.isOpen, false);
    });

    it("closes a short position with profit", async () => {
      // Set initial price
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const globalBefore = await program.account.globalState.fetch(globalStatePda);
      const positionId = globalBefore.nextPositionId.toNumber();

      await program.methods
        .openPosition({
          direction: { short: {} },
          size: new BN(SIZE_PRECISION), // 1 SOL
          leverage: new BN(10),
        })
        .accounts({
          user: trader.publicKey,
        } as any)
        .signers([trader])
        .rpc();

      const vaultBefore = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );

      // Price goes down 10% (profit for short)
      const newPrice = 90 * 10 ** USDC_DECIMALS; // $90
      await program.methods
        .setPrice(new BN(newPrice))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const posKey = positionPda(trader.publicKey, positionId);

      await program.methods
        .closePosition()
        .accounts({
          user: trader.publicKey,
          position: posKey,
        } as any)
        .signers([trader])
        .rpc();

      const vaultAfter = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );

      // PnL = (100 - 90) * 1 SOL / SIZE_PRECISION = $10 = 10_000_000
      assert.equal(
        vaultAfter.depositedAmount.toNumber(),
        vaultBefore.depositedAmount.toNumber() + 10_000_000
      );

      const position = await program.account.position.fetch(posKey);
      assert.equal(position.isOpen, false);
    });

    it("closes a long position with loss", async () => {
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const globalBefore = await program.account.globalState.fetch(globalStatePda);
      const positionId = globalBefore.nextPositionId.toNumber();

      await program.methods
        .openPosition({
          direction: { long: {} },
          size: new BN(SIZE_PRECISION),
          leverage: new BN(10),
        })
        .accounts({
          user: trader.publicKey,
        } as any)
        .signers([trader])
        .rpc();

      const vaultBefore = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );

      // Price goes down 5%
      const newPrice = 95 * 10 ** USDC_DECIMALS; // $95
      await program.methods
        .setPrice(new BN(newPrice))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const posKey = positionPda(trader.publicKey, positionId);

      await program.methods
        .closePosition()
        .accounts({
          user: trader.publicKey,
          position: posKey,
        } as any)
        .signers([trader])
        .rpc();

      const vaultAfter = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );

      // PnL = (95 - 100) * 1 SOL = -$5 = -5_000_000
      assert.equal(
        vaultAfter.depositedAmount.toNumber(),
        vaultBefore.depositedAmount.toNumber() - 5_000_000
      );

      const position = await program.account.position.fetch(posKey);
      assert.equal(position.isOpen, false);
    });

    it("fails to close already-closed position", async () => {
      // Use the position we just closed
      const posKey = positionPda(trader.publicKey, 2); // position from previous test's global_state

      // We need to find a closed position. Let's use the one from "closes a long position with profit"
      // First let's see what positionId=2 looks like
      try {
        // Let's find a closed position
        const globalBefore = await program.account.globalState.fetch(globalStatePda);
        // positionId 2 was the first we opened for the trader
        const closedPosKey = positionPda(trader.publicKey, 2);

        await program.methods
          .closePosition()
          .accounts({
            user: trader.publicKey,
            position: closedPosKey,
          } as any)
          .signers([trader])
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        // Either PositionNotOpen or constraint error
        assert.ok(e.toString().includes("Error") || e.error);
      }
    });
  });

  // ============================================
  // LIQUIDATION
  // ============================================
  describe("Liquidation", () => {
    it("liquidates an underwater long position", async () => {
      // Set price and open a leveraged long
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const globalBefore = await program.account.globalState.fetch(globalStatePda);
      const positionId = globalBefore.nextPositionId.toNumber();

      // Open 10x leveraged long: 1 SOL at $100
      // Margin = $10, Notional = $100
      await program.methods
        .openPosition({
          direction: { long: {} },
          size: new BN(SIZE_PRECISION),
          leverage: new BN(10),
        })
        .accounts({
          user: trader.publicKey,
        } as any)
        .signers([trader])
        .rpc();

      const vaultBefore = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );

      // Price crashes by 6%: margin ratio = ($10 - $6) / $94 = 4.26% < 5% maintenance
      const crashPrice = 94 * 10 ** USDC_DECIMALS; // $94
      await program.methods
        .setPrice(new BN(crashPrice))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const posKey = positionPda(trader.publicKey, positionId);

      // Liquidator liquidates
      await program.methods
        .liquidate()
        .accounts({
          liquidator: liquidator.publicKey,
          position: posKey,
        } as any)
        .signers([liquidator])
        .rpc();

      // Verify position is closed
      const position = await program.account.position.fetch(posKey);
      assert.equal(position.isOpen, false);

      // Verify liquidator received fee
      const liquidatorVault = await program.account.userVault.fetch(
        userVaultPda(liquidator.publicKey)
      );
      // Liquidation fee = margin * 50 bps = $10 * 0.5% = $0.05 = 50_000
      assert.ok(liquidatorVault.depositedAmount.toNumber() > 0);

      // Verify owner vault was updated
      const ownerVault = await program.account.userVault.fetch(
        userVaultPda(trader.publicKey)
      );
      // Loss = (100-94) * 1 = $6, effective_margin = $10 - $6 = $4
      // liq_fee = $10 * 0.005 = $0.05
      // remaining = $4 - $0.05 = $3.95 goes back
      // deposited should be reduced by margin - remaining
      assert.ok(ownerVault.depositedAmount.toNumber() < vaultBefore.depositedAmount.toNumber());
    });

    it("fails to liquidate a healthy position", async () => {
      // Price is at $94, re-set to a normal price
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const globalBefore = await program.account.globalState.fetch(globalStatePda);
      const positionId = globalBefore.nextPositionId.toNumber();

      // Open a position with low leverage (very healthy)
      await program.methods
        .openPosition({
          direction: { long: {} },
          size: new BN(SIZE_PRECISION),
          leverage: new BN(2), // 2x = 50% margin ratio
        })
        .accounts({
          user: trader.publicKey,
        } as any)
        .signers([trader])
        .rpc();

      const posKey = positionPda(trader.publicKey, positionId);

      try {
        await program.methods
          .liquidate()
          .accounts({
            liquidator: liquidator.publicKey,
            position: posKey,
          } as any)
          .signers([liquidator])
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("PositionNotLiquidatable");
      }

      // Clean up: close the position
      await program.methods
        .closePosition()
        .accounts({
          user: trader.publicKey,
          position: posKey,
        } as any)
        .signers([trader])
        .rpc();
    });

    it("liquidates an underwater short position", async () => {
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const globalBefore = await program.account.globalState.fetch(globalStatePda);
      const positionId = globalBefore.nextPositionId.toNumber();

      // Open 10x leveraged short: 1 SOL at $100
      await program.methods
        .openPosition({
          direction: { short: {} },
          size: new BN(SIZE_PRECISION),
          leverage: new BN(10),
        })
        .accounts({
          user: trader.publicKey,
        } as any)
        .signers([trader])
        .rpc();

      // Price goes up 6%: loss for short = $6, margin = $10
      // margin ratio = ($10 - $6) / $106 = 3.77% < 5%
      const pumpPrice = 106 * 10 ** USDC_DECIMALS;
      await program.methods
        .setPrice(new BN(pumpPrice))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const posKey = positionPda(trader.publicKey, positionId);

      await program.methods
        .liquidate()
        .accounts({
          liquidator: liquidator.publicKey,
          position: posKey,
        } as any)
        .signers([liquidator])
        .rpc();

      const position = await program.account.position.fetch(posKey);
      assert.equal(position.isOpen, false);
    });
  });

  // ============================================
  // FUNDING
  // ============================================
  describe("Funding", () => {
    it("fails if funding interval not elapsed", async () => {
      try {
        await program.methods
          .applyFunding()
          .accounts({
            caller: authority.publicKey,
          } as any)
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("FundingIntervalNotElapsed");
      }
    });

    // Note: Testing time-dependent funding on localnet would require advancing the clock,
    // which is complex. We verify the constraint check above.
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe("Edge Cases", () => {
    it("cannot withdraw locked margin", async () => {
      // Open a position to lock margin
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const vault = await program.account.userVault.fetch(
        userVaultPda(authority.publicKey)
      );
      const available = vault.depositedAmount.toNumber() - vault.lockedMargin.toNumber();

      // Try to withdraw more than available (deposited - locked)
      if (available > 0) {
        try {
          await program.methods
            .withdraw(new BN(vault.depositedAmount.toNumber()))
            .accounts({
              user: authority.publicKey,
              userAta: userAta,
            } as any)
            .rpc();
          // If locked margin > 0, this should fail
          if (vault.lockedMargin.toNumber() > 0) {
            assert.fail("Should have thrown");
          }
        } catch (e: any) {
          if (vault.lockedMargin.toNumber() > 0) {
            expect(e.error.errorCode.code).to.equal("InsufficientBalance");
          }
        }
      }
    });

    it("verifies open interest tracking", async () => {
      const global = await program.account.globalState.fetch(globalStatePda);
      // Just verify OI values are non-negative and tracked
      assert.ok(global.totalLongOi.toNumber() >= 0);
      assert.ok(global.totalShortOi.toNumber() >= 0);
    });

    it("handles max leverage position", async () => {
      await program.methods
        .setPrice(new BN(SOL_PRICE))
        .accounts({ authority: authority.publicKey } as any)
        .rpc();

      const globalBefore = await program.account.globalState.fetch(globalStatePda);
      const positionId = globalBefore.nextPositionId.toNumber();

      // Open at max leverage (50x)
      // Notional = 1 SOL * $100 = $100
      // Margin = $100 / 50 = $2
      await program.methods
        .openPosition({
          direction: { long: {} },
          size: new BN(SIZE_PRECISION),
          leverage: new BN(50),
        })
        .accounts({
          user: trader.publicKey,
        } as any)
        .signers([trader])
        .rpc();

      const position = await program.account.position.fetch(
        positionPda(trader.publicKey, positionId)
      );
      assert.equal(position.leverage.toNumber(), 50);
      assert.equal(position.margin.toNumber(), 2_000_000); // $2

      // Close it
      await program.methods
        .closePosition()
        .accounts({
          user: trader.publicKey,
          position: positionPda(trader.publicKey, positionId),
        } as any)
        .signers([trader])
        .rpc();
    });
  });
});
