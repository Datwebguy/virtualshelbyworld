/**
 * ShelbyUSD — Fungible Asset on Shelbynet (Shelby Protocol's own chain).
 * Used for paying blob upload fees to the Shelby storage network.
 * NOT available on standard Aptos Testnet — do not use for tipping.
 */
export const SHELBY_USD_METADATA =
  "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";

export const SHELBY_USD_SYMBOL = "ShelbyUSD";
export const SHELBY_USD_DECIMALS = 6;

export const SHELBY_USD_FAUCET_URL = "https://docs.shelby.xyz/apis/faucet/shelbyusd";

export const shelbyUsdToUnits = (amount: number): string =>
  String(Math.floor(amount * 10 ** SHELBY_USD_DECIMALS));

export const unitsToShelbyUsd = (units: number): number =>
  units / 10 ** SHELBY_USD_DECIMALS;

// ─── APT Tipping ──────────────────────────────────────────────────────────────
// Tips are paid in APT (standard Aptos Testnet) — works immediately, no
// custom network setup required. APT also covers the gas fee.

/** Preset tip amounts in APT */
export const APT_TIP_PRESETS = [0.01, 0.05, 0.1, 0.5];

/** Label shown in the tip UI */
export const TIP_SYMBOL = "APT";

/** Minimum APT needed to cover a tip + gas (~0.0005 APT gas overhead) */
export const MIN_APT_FOR_TIP = 0.011; // tip amount is on top of this

/** Minimum APT required to cover gas on Aptos Testnet */
export const MIN_APT_FOR_GAS = 0.001;

/** APT faucet for gas + tips */
export const APT_FAUCET_URL = "https://docs.shelby.xyz/apis/faucet/aptos";

// Legacy alias so old imports don't break
export const SHELBY_USD_PRESETS = APT_TIP_PRESETS;
