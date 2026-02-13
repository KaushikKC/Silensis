/**
 * Price keeper — continuously updates the oracle price to keep it fresh.
 * The program rejects transactions if price is stale (>30s).
 *
 * Usage:
 *   npx tsx scripts/price-keeper.ts
 *   npx tsx scripts/price-keeper.ts 150   # set price to $150
 *
 * Refreshes every 10 seconds with the same price (or a new one if you
 * edit the PRICE variable below or pass it as an argument).
 */

import { Connection, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Use app IDL so program ID matches deployed program (same as setup-localnet and frontend)
const idlPath = path.resolve(__dirname, "../src/idl/mini_perps.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";
const USDC_DECIMALS = 6;
const REFRESH_INTERVAL = 10_000; // 10 seconds

// Default $100, override via CLI arg: npx tsx scripts/price-keeper.ts 150
let PRICE = parseFloat(process.argv[2] || "100");

async function main() {
  const walletPath = path.resolve(os.homedir(), ".config/solana/id.json");
  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  const connection = new Connection(RPC_URL, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 90_000, // 90s for localnet
  });
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl, provider);

  console.log("Price Keeper started");
  console.log("Authority:", payer.publicKey.toBase58());
  console.log(`Price: $${PRICE} | Refresh: every ${REFRESH_INTERVAL / 1000}s`);
  console.log("Press Ctrl+C to stop\n");

  const updatePrice = async () => {
    try {
      const priceBn = new BN(Math.floor(PRICE * 10 ** USDC_DECIMALS));
      const tx = await program.methods
        .setPrice(priceBn)
        .accounts({
          authority: payer.publicKey,
        } as any)
        .rpc();
      console.log(
        `[${new Date().toLocaleTimeString()}] Price set to $${PRICE} — tx: ${tx.slice(
          0,
          16,
        )}...`,
      );
    } catch (err: any) {
      console.error(`[${new Date().toLocaleTimeString()}] Error:`, err.message);
    }
  };

  // Initial update
  await updatePrice();

  // Keep refreshing
  setInterval(updatePrice, REFRESH_INTERVAL);
}

main().catch((err) => {
  console.error("Price keeper failed:", err);
  process.exit(1);
});
