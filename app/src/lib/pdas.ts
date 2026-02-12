import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID, SEEDS } from "./constants";

export function getGlobalStatePda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.GLOBAL_STATE)],
    PROGRAM_ID
  );
  return pda;
}

export function getPriceFeedPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.PRICE_FEED)],
    PROGRAM_ID
  );
  return pda;
}

export function getUserVaultPda(user: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.USER_VAULT), user.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getTreasuryPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.TREASURY)],
    PROGRAM_ID
  );
  return pda;
}

export function getPositionPda(
  user: PublicKey,
  positionId: BN
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.POSITION),
      user.toBuffer(),
      positionId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
  return pda;
}
