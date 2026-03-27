import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

/** Encode a UTF-8 string as a plain number array (vector<u8> for Move) */
function stringToBytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

export interface RegisterVideoArgs {
  cid: string;            // Shelby content identifier (becomes blob_name + commitment)
  title: string;
  description: string;
  creatorAddress: string;
  fileSize: number;       // bytes — required by register_blob
}

/**
 * Registers a video blob on Shelby's network using the real
 * blob_metadata::register_blob contract.
 *
 * Contract: 0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a
 * Function: blob_metadata::register_blob
 *
 * Args (on-chain order):
 *   1. blob_name        String       — human-readable identifier (CID)
 *   2. blob_size        u64          — file size in bytes
 *   3. blob_commitment  vector<u8>   — content commitment (CID bytes)
 *   4. chunkset_count   u32          — number of chunksets (1 for single video)
 *   5. expiration_micros u64         — Unix microseconds when blob expires
 *   6. payment_tier_id  u8           — 0 = basic tier
 *   7. encoding         u8           — 1 = Clay (10+6) erasure coding
 *
 * Note: This contract lives on Shelbynet (Shelby's chain). The call is
 * attempted after upload and skipped gracefully if the wallet is on a
 * different network.
 */
export const registerVideo = (args: RegisterVideoArgs): InputTransactionData => {
  // Use CID bytes as the blob commitment (content-addressable hash)
  const commitment = stringToBytes(args.cid);

  // Expire in 2 years from now (microseconds)
  const nowMicros = BigInt(Date.now()) * BigInt(1_000);
  const twoYearsMicros = BigInt(2 * 365 * 24 * 60 * 60) * BigInt(1_000_000);
  const expirationMicros = (nowMicros + twoYearsMicros).toString();

  return {
    data: {
      function:
        "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a::blob_metadata::register_blob",
      typeArguments: [],
      functionArguments: [
        args.cid,                      // blob_name: String (CID as identifier)
        args.fileSize.toString(),      // blob_size: u64
        commitment,                    // blob_commitment: vector<u8>
        1,                             // chunkset_count: u32
        expirationMicros,              // expiration_micros: u64
        0,                             // payment_tier_id: u8 (basic/free)
        1,                             // encoding: u8 (1 = Clay 10+6)
      ],
    },
  };
};
