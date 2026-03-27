import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { AccountAddress } from "@aptos-labs/ts-sdk";

/**
 * Normalize any Aptos address to the full 64-char long form (0x + 64 hex chars).
 */
function normalizeAddress(addr: string): string {
  try {
    return AccountAddress.fromString(addr).toStringLong();
  } catch {
    const hex = (addr ?? "").startsWith("0x") ? addr.slice(2) : (addr ?? "");
    return "0x" + hex.padStart(64, "0");
  }
}

export type TipCreatorArgs = {
  creatorAddress: string;
  /** Amount in octas (1 APT = 100_000_000 octas) as a string */
  amountOctas: string;
};

/**
 * APT tip transfer.
 * Uses 0x1::aptos_account::transfer — works on standard Aptos Testnet,
 * auto-creates recipient account if needed.
 * APT covers both the tip amount AND the gas fee.
 */
export const tipCreator = (args: TipCreatorArgs): InputTransactionData => ({
  data: {
    function: "0x1::aptos_account::transfer",
    typeArguments: [],
    functionArguments: [
      normalizeAddress(args.creatorAddress),
      args.amountOctas,
    ],
  },
});

/** Convert APT float → octas string (1 APT = 100_000_000 octas) */
export const aptToOctas = (apt: number): string =>
  String(Math.floor(apt * 1e8));

// Legacy alias — kept so old call-sites compile without changes
export const shelbyUsdToTipUnits = aptToOctas;
