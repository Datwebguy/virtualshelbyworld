"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trash2, Upload, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ShelbyVideo } from "@/lib/shelby";
import { VideoCard } from "./VideoCard";
import { VideoPlayer } from "./VideoPlayer";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { tipCreator, aptToOctas } from "@/entry-functions/tipCreator";
import { TIP_SYMBOL } from "@/lib/shelbyUSD";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { getVideoFile, deleteVideoFile } from "@/lib/videoDB";

const LS_KEY = "vsw_uploads";

interface UploadsRowProps {
  likedSet: Set<string>;
  onToggleLike: (cid: string) => void;
  onWatch: (video: ShelbyVideo) => void;
}

export function UploadsRow({
  likedSet,
  onToggleLike,
  onWatch,
}: UploadsRowProps) {
  const [videos, setVideos] = useState<ShelbyVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<ShelbyVideo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Track blob URLs we create so we can revoke them on cleanup
  const blobUrls = useRef<Map<string, string>>(new Map());
  const rowRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const dragging = useRef(false);
  const { signAndSubmitTransaction, connected } = useWallet();

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
  const { toast } = useToast();

  const load = async () => {
    try {
      const stored: ShelbyVideo[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
      // Resolve each video's streamUrl — blob: URLs from previous sessions are dead,
      // so we recreate them from IndexedDB where the actual File was saved.
      const resolved = await Promise.all(
        stored.map(async (v) => {
          // If URL is already a real HTTP(S) URL, keep it as-is
          if (v.streamUrl.startsWith("http")) return v;
          // Reuse a blob URL we already created this session
          if (blobUrls.current.has(v.cid)) {
            return { ...v, streamUrl: blobUrls.current.get(v.cid)! };
          }
          // Try to resurrect the file from IndexedDB
          try {
            const file = await getVideoFile(v.cid);
            if (file) {
              const url = URL.createObjectURL(file);
              blobUrls.current.set(v.cid, url);
              return { ...v, streamUrl: url };
            }
          } catch {}
          // No file found — mark as unplayable
          return { ...v, streamUrl: "" };
        })
      );
      setVideos(resolved);
    } catch {
      setVideos([]);
    }
  };

  useEffect(() => {
    load();
    // Revoke all blob URLs when component unmounts
    return () => {
      blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteVideo = async (cid: string) => {
    try {
      const updated = videos.filter((v) => v.cid !== cid);
      // Update localStorage (keep raw entries without resolved blob URLs)
      const raw: ShelbyVideo[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
      localStorage.setItem(LS_KEY, JSON.stringify(raw.filter((v) => v.cid !== cid)));
      // Remove file from IndexedDB
      await deleteVideoFile(cid).catch(() => {});
      // Revoke the blob URL if we created one
      const url = blobUrls.current.get(cid);
      if (url) { URL.revokeObjectURL(url); blobUrls.current.delete(cid); }
      setVideos(updated);
      toast({ title: "Deleted", description: "Video removed from your uploads." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete video." });
    }
    setConfirmDelete(null);
  };

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

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  // Not connected — show wallet gate prompt
  if (!connected) {
    return (
      <section className="px-6 md:px-12 pt-8 pb-10" id="uploads">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">My Uploads</h2>
          <div
            className="rounded-xl border border-white/8 p-8 flex flex-col items-center gap-3 text-center"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <Upload className="h-8 w-8 text-white/15" />
            <p className="text-white/50 text-sm font-medium">Connect your wallet to manage your uploads</p>
            <p className="text-white/25 text-xs">Sign in to view, play, and delete videos you&apos;ve uploaded.</p>
          </div>
        </motion.div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="px-6 md:px-12 pt-8 pb-10" id="uploads">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">My Uploads</h2>
          <div
            className="rounded-xl border border-white/8 p-8 flex flex-col items-center gap-3 text-center"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <Upload className="h-8 w-8 text-white/15" />
            <p className="text-white/30 text-sm">You haven&apos;t uploaded anything yet. Be the first to share your content.</p>
            <Link
              href="/studio"
              className="mt-1 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: "#E50914" }}
            >
              + Upload Video
            </Link>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative px-3 md:px-12 pt-6 md:pt-8 pb-8 md:pb-10" id="uploads">
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-white">My Uploads</h2>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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
          <div key={video.cid} className="flex-shrink-0 flex flex-col gap-2" style={{ scrollSnapAlign: "start" }}>
            {/* Unplayable warning badge */}
            {!video.streamUrl && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-yellow-300/80 border border-yellow-500/20 bg-yellow-500/8">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                File not found — re-upload to restore
              </div>
            )}
            <VideoCard
              video={video}
              index={i}
              isLiked={likedSet.has(video.cid)}
              showRank={false}
              onPlay={() => {
                if (!video.streamUrl) {
                  toast({ variant: "destructive", title: "Can't play", description: "The original file is no longer available. Re-upload to restore." });
                  return;
                }
                setActiveVideo(video);
                onWatch(video);
              }}
              onLike={() => onToggleLike(video.cid)}
              onQuickTip={(amt) => handleQuickTip(video, amt)}
            />
            {/* Delete button — below the card, always visible, no z-index fight */}
            <button
              onClick={() => setConfirmDelete(video.cid)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/25 bg-red-500/8 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Delete Video
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDelete(null)} />
            <motion.div
              className="relative rounded-2xl border border-white/10 p-6 max-w-sm w-full text-center space-y-4"
              style={{ background: "#1a1a1a" }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <Trash2 className="h-8 w-8 text-red-400 mx-auto" />
              <div>
                <p className="text-white font-semibold text-lg">Delete this video?</p>
                {videos.find((v) => v.cid === confirmDelete)?.title && (
                  <p className="text-white/60 text-sm mt-1 font-medium">
                    &ldquo;{videos.find((v) => v.cid === confirmDelete)?.title}&rdquo;
                  </p>
                )}
                <p className="text-white/35 text-xs mt-2 leading-relaxed">
                  This removes it from the platform permanently. It cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteVideo(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: "#E50914" }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
