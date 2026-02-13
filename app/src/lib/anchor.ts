import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "./constants";
import idl from "../idl/mini_perps.json";
import type { MiniPerps } from "../idl/mini_perps";

export function getProvider(connection: Connection, wallet: AnchorWallet) {
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
}

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = getProvider(connection, wallet);
  return new Program<MiniPerps>(idl as MiniPerps, provider);
}

export function getReadonlyProgram(connection: Connection) {
  // Create a dummy wallet for read-only access
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: () => Promise.reject(),
    signAllTransactions: () => Promise.reject(),
  } as AnchorWallet;
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  return new Program<MiniPerps>(idl as MiniPerps, provider);
}
