"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Maximize, Pause, Play } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const SHELBY_RPC_GATEWAY = "https://rpc.testnet.shelby.xyz";

interface VideoPlayerProps {
  /** Shelby CID or full stream URL */
  streamUrl: string;
  title: string;
  onClose: () => void;
}

export function VideoPlayer({ streamUrl, title, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const resolvedUrl = streamUrl.startsWith("http") || streamUrl.startsWith("blob:")
    ? streamUrl
    : `${SHELBY_RPC_GATEWAY}/stream/${streamUrl}`;

  useEffect(() => {
    videoRef.current?.play().catch(() => setPlaying(false));
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration) setProgress((currentTime / duration) * 100);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const fullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-5xl mx-0 md:mx-4 md:rounded-xl overflow-hidden shadow-2xl bg-black"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close — 48×48 tap target on mobile */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-black/70 text-white active:bg-white/30 transition-all"
            aria-label="Close player"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Video */}
          <video
            ref={videoRef}
            src={resolvedUrl}
            className="w-full aspect-video bg-black"
            onTimeUpdate={onTimeUpdate}
            onEnded={() => setPlaying(false)}
            playsInline
          />

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent px-3 md:px-6 pb-4 md:pb-5 pt-12 md:pt-14">
            {/* Progress bar — tall hit area for mobile */}
            <div
              className="w-full mb-4 cursor-pointer flex items-center"
              style={{ height: 28 }}
              onClick={seek}
              onTouchStart={seek}
            >
              <div className="w-full h-1.5 bg-white/20 rounded-full relative">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: "#E50914" }}
                />
                {/* Scrubber thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {/* Play/Pause — 44px tap target */}
                <button
                  onClick={togglePlay}
                  className="flex items-center justify-center w-11 h-11 rounded-full text-white active:bg-white/20 transition-colors"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-white" />}
                </button>
                {/* Mute — 44px tap target */}
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center w-11 h-11 rounded-full text-white active:bg-white/20 transition-colors"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <span className="text-xs md:text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[200px] md:max-w-none ml-1">
                  {title}
                </span>
              </div>
              {/* Fullscreen — 44px tap target */}
              <button
                onClick={fullscreen}
                className="flex items-center justify-center w-11 h-11 rounded-full text-white active:bg-white/20 transition-colors"
                aria-label="Fullscreen"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/20 tracking-widest uppercase hidden md:block">
          Streaming via Shelby Hot Storage
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
