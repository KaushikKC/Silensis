/**
 * Export the default Solana CLI keypair to base58 (for Phantom/Solflare import).
 * Modern Solana CLI (Agave) no longer has "solana keypair export".
 *
 * Usage: npx tsx scripts/export-keypair-base58.ts
 * Or:    npx tsx scripts/export-keypair-base58.ts /path/to/keypair.json
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import bs58 from "bs58";

const defaultPath = path.resolve(os.homedir(), ".config/solana/id.json");

function main() {
  const keypairPath = process.argv[2] || defaultPath;
  if (!fs.existsSync(keypairPath)) {
    console.error("Keypair file not found:", keypairPath);
    process.exit(1);
  }
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  if (!Array.isArray(secretKey) || secretKey.length !== 64) {
    console.error("Invalid keypair: expected JSON array of 64 numbers");
    process.exit(1);
  }
  const base58 = bs58.encode(Buffer.from(secretKey));
  console.log(base58);
}

main();
