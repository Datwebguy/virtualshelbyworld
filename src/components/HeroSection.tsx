"use client";

import { motion } from "framer-motion";
import { Play, Upload } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { VideoPlayer } from "./VideoPlayer";

// Mosaic thumbnail grid — 24 tiles from mock videos cycled
const MOSAIC_THUMBS = [
  "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=300&q=60",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=60",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=60",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=60",
  "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?w=300&q=60",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300&q=60",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&q=60",
  "https://images.unsplash.com/photo-1536240478700-b869ad10c093?w=300&q=60",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=60",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=60",
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&q=60",
  "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=300&q=60",
  "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&q=60",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300&q=60",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=60",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=60",
  "https://images.unsplash.com/photo-1605106702842-01a887a31122?w=300&q=60",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&q=60",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&q=60",
];

const FEATURED_STREAM = "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Build 24-tile mosaic cycling through thumbs
  const tiles = Array.from({ length: 24 }, (_, i) => MOSAIC_THUMBS[i % MOSAIC_THUMBS.length]);

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "100vh", marginTop: 0 }}>
      {/* ── Mosaic thumbnail grid ── */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: "repeat(6, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          transform: "skewY(-3deg) scale(1.15)",
          transformOrigin: "top center",
        }}
      >
        {tiles.map((src, i) => (
          <motion.div
            key={i}
            className="relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03, duration: 0.6 }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.55) saturate(0.8)" }}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Gradient overlays ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 40%, rgba(20,20,20,0.96) 85%, #141414 100%)",
        }}
      />
      {/* Red glow at bottom edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: "linear-gradient(to right, transparent, #E50914, transparent)" }}
      />

      {/* ── Centered content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 md:py-40 min-h-screen">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-white/15 text-xs font-bold uppercase tracking-widest text-white/60"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Powered by Shelby Hot Storage · Aptos Testnet
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-4 max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          Decentralized Video.
          <br />
          <span style={{ color: "#E50914" }}>Owned by You.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-base sm:text-lg md:text-xl text-white/65 mb-3 max-w-xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Stream and earn on the world&rsquo;s first Web3 video platform built on Shelby Hot Storage.
        </motion.p>
        <motion.p
          className="text-sm text-white/35 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          Permanent storage · Clay (10+6) erasure coding · Tip creators in APT
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <button
            onClick={() => setIsPlaying(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-md font-bold text-black text-base transition-all hover:scale-105 active:scale-95 shadow-xl"
            style={{ backgroundColor: "#ffffff", minWidth: 200 }}
          >
            <Play className="h-5 w-5 fill-black" />
            Start Watching
          </button>
          <Link
            href="/studio"
            className="flex items-center gap-2 px-8 py-3.5 rounded-md font-bold text-white text-base transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: "#E50914", minWidth: 200 }}
          >
            <Upload className="h-5 w-5" />
            Upload Your Video
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="mt-auto pt-8 pb-6 flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <span className="text-white/25 text-xs uppercase tracking-widest">Scroll to explore</span>
          <motion.div
            className="w-0.5 h-8 rounded-full"
            style={{ background: "linear-gradient(to bottom, rgba(229,9,20,0.7), transparent)" }}
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {isPlaying && (
        <VideoPlayer
          streamUrl={FEATURED_STREAM}
          title="Tears of Steel"
          onClose={() => setIsPlaying(false)}
        />
      )}
    </section>
  );
}
