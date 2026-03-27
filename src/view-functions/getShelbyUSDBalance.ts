import { SHELBY_USD_METADATA, unitsToShelbyUsd } from "@/lib/shelbyUSD";

/**
 * Fetch ShelbyUSD FA balance on standard Aptos Testnet.
 *
 * We ONLY query standard testnet because:
 * - Petra wallet is connected to Aptos Testnet (chain ID 2)
 * - Transactions are submitted to that chain
 * - Checking Shelbynet (a different chain) causes a false-positive:
 *   the balance looks non-zero but the wallet submission still fails.
 */
const APTOS_TESTNET_REST = "https://api.testnet.aptoslabs.com/v1";

export async function getShelbyUSDBalance(accountAddress: string): Promise<number> {
  try {
    const res = await fetch(`${APTOS_TESTNET_REST}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: "0x1::primary_fungible_store::balance",
        type_arguments: ["0x1::fungible_asset::Metadata"],
        arguments: [accountAddress, SHELBY_USD_METADATA],
      }),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    const raw = Array.isArray(json) ? json[0] : json;
    const result = unitsToShelbyUsd(Number(raw));
    return isNaN(result) ? 0 : result;
  } catch {
    return 0;
  }
}
