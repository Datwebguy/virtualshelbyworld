"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ShelbyVideo } from "@/lib/shelby";
import { VideoCard } from "./VideoCard";
import { VideoPlayer } from "./VideoPlayer";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { tipCreator, aptToOctas } from "@/entry-functions/tipCreator";
import { TIP_SYMBOL } from "@/lib/shelbyUSD";
import { useToast } from "@/components/ui/use-toast";
import { getVideoFile } from "@/lib/videoDB";

const LS_KEY = "vsw_uploads";

interface NewUploadsRowProps {
  likedSet: Set<string>;
  onToggleLike: (cid: string) => void;
  onWatch: (video: ShelbyVideo) => void;
}

export function NewUploadsRow({ likedSet, onToggleLike, onWatch }: NewUploadsRowProps) {
  const [videos, setVideos] = useState<ShelbyVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<ShelbyVideo | null>(null);
  const blobUrls = useRef<Map<string, string>>(new Map());
  const rowRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const dragging = useRef(false);
  const { signAndSubmitTransaction, connected } = useWallet();
  const { toast } = useToast();

  const onMouseDown = (e: React.MouseEvent) => {
    if (!rowRef.current) return;
    dragging.current = true;
    dragStart.current = { x: e.pageX - rowRef.current.offsetLeft, scrollLeft: rowRef.current.scrollLeft };
    rowRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !rowRef.current) return;
    rowRef.current.scrollLeft = dragStart.current.scrollLeft - (e.pageX - rowRef.current.offsetLeft - dragStart.current.x);
  };
  const onDragEnd = () => {
    dragging.current = false;
    if (rowRef.current) rowRef.current.style.cursor = "grab";
  };

  useEffect(() => {
    (async () => {
      try {
        // Fetch from shared registry (all users' uploads)
        let apiVideos: ShelbyVideo[] = [];
        try {
          const res = await fetch("/api/videos");
          if (res.ok) apiVideos = await res.json();
        } catch {}

        // Merge with localStorage (uploader's own device — may have fresher blob URLs)
        const local: ShelbyVideo[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
        const localMap = new Map(local.map((v) => [v.cid, v]));

        // Build merged list: prefer local entry (has blob URL) if available, else use API entry
        const apiMap = new Map(apiVideos.map((v) => [v.cid, v]));
        const allCids = new Set([...apiMap.keys(), ...localMap.keys()]);

        const merged = await Promise.all(
          Array.from(allCids).map(async (cid) => {
            const local = localMap.get(cid);
            const remote = apiMap.get(cid);
            const base = remote ?? local!;

            // Try to resolve a playable streamUrl
            let streamUrl = base.streamUrl;

            // If local has a blob URL still alive, prefer it
            if (local) {
              if (local.streamUrl.startsWith("blob:")) {
                streamUrl = local.streamUrl;
              } else if (!local.streamUrl.startsWith("http")) {
                // Try IndexedDB
                if (blobUrls.current.has(cid)) {
                  streamUrl = blobUrls.current.get(cid)!;
                } else {
                  try {
                    const file = await getVideoFile(cid);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      blobUrls.current.set(cid, url);
                      streamUrl = url;
                    }
                  } catch {}
                }
              }
            }

            return { ...base, streamUrl };
          })
        );

        // Sort newest first, show all (even if streamUrl may not resolve for remote users)
        const sorted = merged.sort((a, b) =>
          new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime()
        );
        setVideos(sorted.filter((v) => v.streamUrl));
      } catch {
        setVideos([]);
      }
    })();
    return () => { blobUrls.current.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  const handleQuickTip = async (video: ShelbyVideo, amount: number): Promise<string> => {
    if (!connected) {
      toast({ variant: "destructive", title: "Connect Wallet", description: "Sign in to tip creators." });
      return "";
    }
    try {
      const res = await signAndSubmitTransaction(
        tipCreator({ creatorAddress: video.creator, amountOctas: aptToOctas(amount) })
      );
      toast({ title: "⚡ Tip Sent!", description: `${amount} ${TIP_SYMBOL} sent to ${video.creatorName}` });
      return res?.hash ?? "";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isExpired = /expired|session|keyless|ephemeral|oidc|sign.?in/i.test(msg);
      const isPopup = /prompt|popup|window|blocked|open/i.test(msg);
      const isInsufficient = /insufficient|balance|gas|fund|withdraw|transfer/i.test(msg);
      toast({
        variant: "destructive",
        title: isExpired ? "Session Expired" : isInsufficient ? "Insufficient APT" : isPopup ? "Signing Blocked" : "Tip Failed",
        description: isExpired
          ? "Your Google session expired. Please sign in again."
          : isInsufficient
          ? "You need more testnet APT. Use 'Get APT' in the menu."
          : isPopup
          ? "Allow pop-ups for this site and try again."
          : "Transaction rejected or failed. Please try again.",
      });
      return "";
    }
  };

  if (videos.length === 0) return null;

  return (
    <section className="relative px-3 md:px-12 pt-6 md:pt-8 pb-8 md:pb-10" id="new-uploads">
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-white">New on Platform</h2>
          <span
            className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,215,0,0.15)", color: "#FFD700" }}
          >
            <Sparkles className="h-3 w-3" />
            FRESH
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 active:bg-white/30 text-white transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 active:bg-white/30 text-white transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      <div
        ref={rowRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        className="flex gap-4 overflow-x-auto py-7"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
          cursor: "grab",
        } as React.CSSProperties}
      >
        {videos.map((video, i) => (
          <div key={video.cid} className="flex-shrink-0 relative" style={{ scrollSnapAlign: "start" }}>
            {/* NEW badge */}
            <div
              className="absolute top-2 left-2 z-10 text-xs font-black px-2 py-0.5 rounded"
              style={{ backgroundColor: "#E50914", color: "#fff" }}
            >
              NEW
            </div>
            <VideoCard
              video={video}
              index={i}
              isLiked={likedSet.has(video.cid)}
              showRank={false}
              onPlay={() => { setActiveVideo(video); onWatch(video); }}
              onLike={() => onToggleLike(video.cid)}
              onQuickTip={(amt) => handleQuickTip(video, amt)}
            />
          </div>
        ))}
      </div>

      {activeVideo && (
        <VideoPlayer
          streamUrl={activeVideo.streamUrl}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </section>
  );
}
