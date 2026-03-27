"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchTrendingVideos, type ShelbyVideo } from "@/lib/shelby";
import { VideoCard } from "./VideoCard";
import { VideoPlayer } from "./VideoPlayer";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { tipCreator, aptToOctas } from "@/entry-functions/tipCreator";
import { TIP_SYMBOL } from "@/lib/shelbyUSD";
import { useToast } from "@/components/ui/use-toast";

interface TrendingRowProps {
  likedSet: Set<string>;
  onToggleLike: (cid: string) => void;
  onWatch: (video: ShelbyVideo) => void;
  searchQuery?: string;
}

export function TrendingRow({
  likedSet,
  onToggleLike,
  onWatch,
  searchQuery = "",
}: TrendingRowProps) {
  const [videos, setVideos] = useState<ShelbyVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<ShelbyVideo | null>(null);
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
    const dist = e.pageX - rowRef.current.offsetLeft - dragStart.current.x;
    rowRef.current.scrollLeft = dragStart.current.scrollLeft - dist;
  };
  const onDragEnd = () => {
    dragging.current = false;
    if (rowRef.current) rowRef.current.style.cursor = "grab";
  };

  useEffect(() => {
    (async () => {
      const platformVideos = await fetchTrendingVideos();
      const cidSet = new Set(platformVideos.map((v) => v.cid));

      // Pull from shared API registry (all user uploads, any device)
      let apiUploads: ShelbyVideo[] = [];
      try {
        const res = await fetch("/api/videos");
        if (res.ok) apiUploads = await res.json();
      } catch {}

      // Also merge localStorage (uploader's own blob URLs take priority)
      let localUploads: ShelbyVideo[] = [];
      try {
        localUploads = JSON.parse(localStorage.getItem("vsw_uploads") ?? "[]");
      } catch {}

      // Build a map: local overrides API (has better streamUrl for uploader)
      const uploadMap = new Map<string, ShelbyVideo>();
      for (const v of apiUploads) uploadMap.set(v.cid, v);
      for (const v of localUploads) uploadMap.set(v.cid, v); // local wins

      const userUploads = Array.from(uploadMap.values()).filter((v) => !cidSet.has(v.cid));
      const merged = [...platformVideos, ...userUploads].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      setVideos(merged);
      setLoading(false);
    })();
  }, []);

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  const handleQuickTip = async (video: ShelbyVideo, amountApt: number): Promise<string> => {
    if (!connected) {
      toast({ variant: "destructive", title: "Connect Wallet", description: "Sign in with Google to tip creators." });
      return "";
    }
    try {
      const res = await signAndSubmitTransaction(
        tipCreator({ creatorAddress: video.creator, amountOctas: aptToOctas(amountApt) })
      );
      toast({ title: "⚡ Tip Sent!", description: `${amountApt} ${TIP_SYMBOL} sent to ${video.creatorName}` });
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

  const filtered = searchQuery
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;

  return (
    <section className="relative px-3 md:px-12 pt-6 md:pt-8 pb-8 md:pb-10" id="trending">
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-white">Trending on Shelby</h2>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: "#E50914", color: "#fff" }}
          >
            LIVE
          </span>
          {searchQuery && (
            <span className="text-xs text-white/40">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>
        {!searchQuery && (
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
        )}
      </motion.div>

      {/* Skeleton */}
      {loading && (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-52 rounded-lg">
              <div className="w-full h-32 bg-white/5 animate-pulse rounded-lg" />
              <div className="mt-2 space-y-1.5">
                <div className="h-3 bg-white/5 animate-pulse rounded w-4/5" />
                <div className="h-2.5 bg-white/5 animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div
          ref={rowRef}
          onMouseDown={searchQuery ? undefined : onMouseDown}
          onMouseMove={searchQuery ? undefined : onMouseMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          className={
            searchQuery
              ? "flex flex-wrap gap-4 pb-2"
              : "flex gap-4 overflow-x-auto py-7"
          }
          style={searchQuery ? {} : {
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
            cursor: "grab",
          } as React.CSSProperties}
        >
          {filtered.map((video, i) => (
            <VideoCard
              key={video.cid}
              video={video}
              index={i}
              isLiked={likedSet.has(video.cid)}
              showRank={!searchQuery}
              onPlay={() => { setActiveVideo(video); onWatch(video); }}
              onLike={() => onToggleLike(video.cid)}
              onQuickTip={(amt) => handleQuickTip(video, amt)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-white/40 text-sm py-8">No videos match &ldquo;{searchQuery}&rdquo;</p>
          )}
        </div>
      )}

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
