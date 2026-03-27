"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useRef, useState } from "react";
import { fetchBrowseCategories, type ShelbyVideo } from "@/lib/shelby";
import { VideoCard } from "./VideoCard";
import { VideoPlayer } from "./VideoPlayer";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { tipCreator, aptToOctas } from "@/entry-functions/tipCreator";
import { TIP_SYMBOL } from "@/lib/shelbyUSD";
import { useToast } from "@/components/ui/use-toast";

interface BrowseSectionProps {
  likedSet: Set<string>;
  onToggleLike: (cid: string) => void;
  onWatch: (video: ShelbyVideo) => void;
  watchHistory: ShelbyVideo[];
}

export function BrowseSection({
  likedSet,
  onToggleLike,
  onWatch,
  watchHistory,
}: BrowseSectionProps) {
  const categories = fetchBrowseCategories();
  const [activeVideo, setActiveVideo] = useState<ShelbyVideo | null>(null);
  const { signAndSubmitTransaction, connected } = useWallet();
  const { toast } = useToast();

  const handleQuickTip = async (video: ShelbyVideo, amountApt: number): Promise<string> => {
    if (!connected) {
      toast({ variant: "destructive", title: "Connect Wallet", description: "Sign in to tip creators." });
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

  return (
    <section id="browse" className="px-3 md:px-12 pb-8 md:pb-10 space-y-6 md:space-y-8">
      {/* Continue Watching */}
      {watchHistory.length > 0 && (
        <CategoryRow
          label="Continue Watching"
          videos={watchHistory}
          likedSet={likedSet}
          onToggleLike={onToggleLike}
          onPlay={(v) => { setActiveVideo(v); onWatch(v); }}
          onQuickTip={handleQuickTip}
          accent
        />
      )}

      {categories.map((cat) => (
        <CategoryRow
          key={cat.id}
          label={cat.label}
          videos={cat.videos}
          likedSet={likedSet}
          onToggleLike={onToggleLike}
          onPlay={(v) => { setActiveVideo(v); onWatch(v); }}
          onQuickTip={handleQuickTip}
        />
      ))}

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

// ---------------------------------------------------------------------------
// CategoryRow
// ---------------------------------------------------------------------------
interface CategoryRowProps {
  label: string;
  videos: ShelbyVideo[];
  likedSet: Set<string>;
  onToggleLike: (cid: string) => void;
  onPlay: (v: ShelbyVideo) => void;
  onQuickTip: (v: ShelbyVideo, amt: number) => Promise<string>;
  accent?: boolean;
}

const CategoryRow = memo(function CategoryRow({
  label,
  videos,
  likedSet,
  onToggleLike,
  onPlay,
  onQuickTip,
  accent = false,
}: CategoryRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const dragging = useRef(false);

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

  const scroll = (dir: "left" | "right") =>
    rowRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });

  return (
    <div>
      <motion.div
        className="flex items-center justify-between mb-3"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h3 className={`text-lg font-bold ${accent ? "text-red-400" : "text-white"}`}>{label}</h3>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 active:bg-white/30 text-white transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 active:bg-white/30 text-white transition-all"
          >
            <ChevronRight className="h-3.5 w-3.5" />
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
          <VideoCard
            key={`${video.cid}-${i}`}
            video={video}
            index={i}
            isLiked={likedSet.has(video.cid)}
            onPlay={() => onPlay(video)}
            onLike={() => onToggleLike(video.cid)}
            onQuickTip={(amt) => onQuickTip(video, amt)}
          />
        ))}
      </div>
    </div>
  );
});
