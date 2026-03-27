/**
 * Shelby Hot Storage upload client.
 *
 * When @shelby-protocol/sdk is published, replace the simulation below with:
 *   import { ShelbyClient } from "@shelby-protocol/sdk";
 *   const client = new ShelbyClient({ rpc: SHELBY_RPC });
 *   const result = await client.upload(file, { encoding: { type: "clay", k: 10, m: 6 } });
 */

import { SHELBY_RPC } from "@/lib/shelby";

/** Clay erasure coding parameters (Shelby default) */
export const CLAY_K = 10; // data shards
export const CLAY_M = 6;  // parity shards
export const CLAY_TOTAL = CLAY_K + CLAY_M; // 16 shards

export type UploadPhase =
  | "idle"
  | "coding"
  | "uploading"
  | "verifying"
  | "registering"
  | "done"
  | "error";

export interface UploadProgress {
  phase: UploadPhase;
  pct: number;
  message: string;
  shardsDone?: number;
  shardsTotal?: number;
}

export interface UploadResult {
  cid: string;
  shelbyUrl: string;
}

function randomCid(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz234567";
  let cid = "bafybei";
  for (let i = 0; i < 52; i++) cid += chars[Math.floor(Math.random() * chars.length)];
  return cid;
}

const tick = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Simulates a full Shelby upload with Clay (10+6) erasure coding.
 * Calls onProgress at each phase so the UI can reflect real upload stages.
 */
export async function uploadToShelby(
  _file: File,
  onProgress: (p: UploadProgress) => void
): Promise<UploadResult> {
  // ── Phase 1: Clay erasure coding ────────────────────────────────────────
  for (let i = 0; i <= 20; i++) {
    await tick(55);
    onProgress({
      phase: "coding",
      pct: Math.round(i * 1.25),       // 0 → 25 %
      message: `Applying Clay (${CLAY_K}+${CLAY_M}) erasure coding… ${i * 5}%`,
    });
  }

  // ── Phase 2: Upload 16 shards ────────────────────────────────────────────
  for (let shard = 1; shard <= CLAY_TOTAL; shard++) {
    await tick(110 + Math.random() * 90);
    const pct = 25 + Math.round((shard / CLAY_TOTAL) * 52); // 25 → 77 %
    onProgress({
      phase: "uploading",
      pct,
      message: `Uploading shard ${shard}/${CLAY_TOTAL} to ${SHELBY_RPC}…`,
      shardsDone: shard,
      shardsTotal: CLAY_TOTAL,
    });
  }

  // ── Phase 3: Verify shard availability ──────────────────────────────────
  onProgress({ phase: "verifying", pct: 80, message: "Verifying shard availability across storage nodes…" });
  await tick(700);
  onProgress({ phase: "verifying", pct: 88, message: `All ${CLAY_TOTAL} shards confirmed available.` });
  await tick(400);

  // ── Phase 4: Aptos Testnet registration (caller handles tx) ───────────────
  onProgress({ phase: "registering", pct: 93, message: "Registering Blob ID on Aptos Testnet coordination layer…" });
  await tick(600);

  onProgress({ phase: "done", pct: 100, message: "Upload complete." });

  const cid = randomCid();
  return { cid, shelbyUrl: `${SHELBY_RPC}/stream/${cid}` };
}
