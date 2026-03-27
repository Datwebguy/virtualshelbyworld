import { NextResponse } from "next/server";
import type { ShelbyVideo } from "@/lib/shelby";

/**
 * Shared in-memory video registry.
 * Persists across requests within the same warm serverless instance.
 * For full persistence across deployments, replace with Vercel KV.
 */
declare global {
  // eslint-disable-next-line no-var
  var __videoRegistry: Map<string, ShelbyVideo> | undefined;
}

function getStore(): Map<string, ShelbyVideo> {
  if (!global.__videoRegistry) {
    global.__videoRegistry = new Map();
  }
  return global.__videoRegistry;
}

export async function GET() {
  const videos = Array.from(getStore().values()).sort(
    (a, b) => new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime()
  );
  return NextResponse.json(videos, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const video: ShelbyVideo = await request.json();
    if (!video?.cid) {
      return NextResponse.json({ error: "Missing cid" }, { status: 400 });
    }
    // Truncate thumbnail to avoid huge payloads (keep first 50KB of base64)
    if (video.thumbnailUrl?.startsWith("data:") && video.thumbnailUrl.length > 50_000) {
      video.thumbnailUrl = "https://images.unsplash.com/photo-1536240478700-b869ad10c093?w=400&q=70";
    }
    getStore().set(video.cid, video);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
