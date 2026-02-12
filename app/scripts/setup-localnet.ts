/**
 * Localnet setup script — run once after `solana-test-validator` + `anchor deploy`.
 *
 * Usage:
 *   npx ts-node --esm scripts/setup-localnet.ts
 *   # or
 *   npx tsx scripts/setup-localnet.ts
 *
 * What it does:
 *   1. Creates a USDC mock mint (6 decimals)
 *   2. Calls initialize() on the program
 *   3. Sets oracle price to $100
 *   4. Creates an ATA for the payer wallet
 *   5. Mints 10,000 test USDC to that ATA
 *
 * Prints the USDC mint address at the end — you can set it as an env var
 * or the frontend will read it from GlobalState on-chain.
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Load IDL
const idlPath = path.resolve(__dirname, "../../target/idl/mini_perps.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

// Config
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";
const USDC_DECIMALS = 6;
const INITIAL_BALANCE = 10_000 * 10 ** USDC_DECIMALS; // 10,000 USDC
const SOL_PRICE = 100 * 10 ** USDC_DECIMALS; // $100

async function main() {
  // Load local wallet
  const walletPath = path.resolve(
    os.homedir(),
    ".config/solana/id.json"
  );
  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl, provider);

  console.log("Payer:", payer.publicKey.toBase58());
  console.log("Program:", program.programId.toBase58());

  // 1. Create USDC mint
  console.log("\n1. Creating USDC mint...");
  const usdcMint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    null, // freeze authority
    USDC_DECIMALS
  );
  console.log("   USDC Mint:", usdcMint.toBase58());

  // 2. Initialize the protocol
  console.log("\n2. Initializing protocol...");
  try {
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: payer.publicKey,
        usdcMint: usdcMint,
      } as any)
      .rpc();
    console.log("   Initialize tx:", tx);
  } catch (err: any) {
    if (err.message?.includes("already in use")) {
      console.log("   Protocol already initialized, skipping.");
    } else {
      throw err;
    }
  }

  // 3. Set oracle price
  console.log("\n3. Setting oracle price to $100...");
  const priceTx = await program.methods
    .setPrice(new BN(SOL_PRICE))
    .accounts({
      authority: payer.publicKey,
    } as any)
    .rpc();
  console.log("   SetPrice tx:", priceTx);

  // 4. Create ATA for payer
  console.log("\n4. Creating ATA for payer wallet...");
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    payer.publicKey
  );
  console.log("   ATA:", ata.address.toBase58());

  // 5. Mint test USDC
  console.log("\n5. Minting 10,000 USDC to payer...");
  const mintTx = await mintTo(
    connection,
    payer,
    usdcMint,
    ata.address,
    payer.publicKey,
    INITIAL_BALANCE
  );
  console.log("   MintTo tx:", mintTx);

  // 6. Deposit initial amount so the UserVault is created
  console.log("\n6. Depositing 1,000 USDC to create UserVault...");
  const depositAmount = 1_000 * 10 ** USDC_DECIMALS;
  const depositTx = await program.methods
    .deposit(new BN(depositAmount))
    .accounts({
      user: payer.publicKey,
      userAta: ata.address,
    } as any)
    .rpc();
  console.log("   Deposit tx:", depositTx);

  console.log("\n=== Setup Complete ===");
  console.log("USDC Mint:", usdcMint.toBase58());
  console.log("Payer balance: 9,000 USDC in ATA + 1,000 USDC in vault");
  console.log("\nYou can now run: cd app && npm run dev");
  console.log("Make sure to keep updating the price (or use the admin panel).");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
