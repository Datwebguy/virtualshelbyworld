import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

/**
 * Aptos client pointed at Shelbynet — Shelby Protocol's Aptos Testnet node.
 * Used for ShelbyUSD FA balance queries.
 * Wallet transactions go through the wallet adapter (same underlying chain).
 */
const shelbynetAptos = new Aptos(
  new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://api.shelbynet.shelby.xyz/v1",
    indexer: "https://api.shelbynet.shelby.xyz/v1/graphql",
  })
);

export function shelbynetClient() {
  return shelbynetAptos;
}
