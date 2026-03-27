"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, RefreshCw } from "lucide-react";
import Script from "next/script";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (el?: HTMLElement) => void;
        createTimeline: (
          source: { sourceType: string; screenName: string },
          target: HTMLElement,
          options: Record<string, unknown>
        ) => Promise<HTMLElement>;
      };
    };
  }
}

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function ShelbyTwitterFeed() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load Twitter widget once script is ready
  useEffect(() => {
    if (!scriptReady || !timelineRef.current) return;

    const target = timelineRef.current;
    let attempts = 0;

    const tryLoad = () => {
      if (window.twttr?.widgets?.createTimeline) {
        // Clear any previous content
        target.innerHTML = "";
        window.twttr.widgets
          .createTimeline(
            { sourceType: "profile", screenName: "shelbyserves" },
            target,
            {
              theme: "dark",
              chrome: "noheader nofooter noborders transparent",
              height: isMobile ? 340 : 460,
              width: "100%",
              tweetLimit: isMobile ? 3 : 5,
            }
          )
          .then(() => setLoaded(true))
          .catch(() => setLoaded(true)); // show section even if blocked
      } else if (attempts < 15) {
        attempts++;
        setTimeout(tryLoad, 400);
      } else {
        setLoaded(true); // give up waiting, show fallback
      }
    };

    tryLoad();
  }, [scriptReady, isMobile]);

  return (
    <section className="px-3 md:px-12 pt-6 md:pt-8 pb-10 md:pb-16" id="shelby-feed">
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Section header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(29,161,242,0.15)" }}
            >
              <XIcon className="h-3.5 w-3.5 text-[#1DA1F2]" />
            </div>
            <h2 className="text-base md:text-xl font-bold text-white">Latest from Shelby</h2>
            <motion.span
              className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
              style={{ backgroundColor: "rgba(29,161,242,0.15)", color: "#1DA1F2" }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              LIVE
            </motion.span>
          </div>
          <a
            href="https://x.com/shelbyserves"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
          >
            View all <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Animated ticker bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-t-2xl border border-b-0 border-white/8 overflow-hidden"
          style={{ background: "rgba(29,161,242,0.07)" }}
        >
          <XIcon className="h-3 w-3 text-[#1DA1F2] flex-shrink-0" />
          <div className="overflow-hidden flex-1 relative">
            <motion.p
              className="text-xs text-white/50 whitespace-nowrap"
              animate={{ x: ["100%", "-100%"] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            >
              Follow @shelbyserves · Shelby Hot Storage · Clay (10+6) erasure coding · Sub-second Web3 video streaming · Aptos Testnet integration · Decentralized storage protocol ·
            </motion.p>
          </div>
        </div>

        {/* Main card */}
        <div
          className="rounded-b-2xl border border-white/8 overflow-hidden"
          style={{ background: "rgba(8,8,8,0.95)" }}
        >
          <div className="flex flex-col md:grid md:grid-cols-2 gap-0">

            {/* Left: Twitter timeline */}
            <div className="relative md:border-r border-white/8">
              {/* Loading state */}
              <AnimatePresence>
                {!loaded && (
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
                    style={{ background: "rgba(8,8,8,0.95)", minHeight: isMobile ? 200 : 340 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-5 w-5 text-[#1DA1F2]/40" />
                    </motion.div>
                    <p className="text-white/25 text-xs">Loading @shelbyserves…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timeline target — widget injects iframe here */}
              <div
                ref={timelineRef}
                className="w-full"
                style={{ minHeight: isMobile ? 200 : 340 }}
              />
            </div>

            {/* Right: Info panel — full width on mobile, side panel on desktop */}
            <div className="p-4 md:p-5 flex flex-col gap-3 md:gap-4 border-t md:border-t-0 border-white/8">
              {/* Profile row */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{ backgroundColor: "#E50914" }}
                >
                  S
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold">@shelbyserves</p>
                  <p className="text-white/40 text-xs truncate">Shelby Hot Storage Protocol</p>
                </div>
                <a
                  href="https://x.com/shelbyserves"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0 transition-all hover:brightness-110"
                  style={{ backgroundColor: "rgba(29,161,242,0.2)", border: "1px solid rgba(29,161,242,0.3)" }}
                >
                  <XIcon className="h-3 w-3 text-[#1DA1F2]" />
                  Follow
                </a>
              </div>

              {/* Info cards — horizontal scroll on mobile */}
              <div className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0"
                style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
              >
                {[
                  { tag: "Hot Storage", text: "Sub-second Web3 video streaming — built for reads, not cold archival." },
                  { tag: "Clay (10+6)", text: "Survives any 6 node failures across 16 distributed shards." },
                  { tag: "Aptos", text: "Every upload is registered on Aptos Testnet — permanent and verifiable." },
                ].map((item) => (
                  <motion.div
                    key={item.tag}
                    className="rounded-xl p-3 border border-white/8 space-y-1.5 flex-shrink-0 w-52 md:w-auto"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                    whileHover={{ borderColor: "rgba(255,255,255,0.15)" }}
                    transition={{ duration: 0.15 }}
                  >
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "rgba(229,9,20,0.15)", color: "#E50914" }}
                    >
                      {item.tag}
                    </span>
                    <p className="text-white/50 text-xs leading-relaxed">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <a
                href="https://x.com/shelbyserves"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 mt-auto"
                style={{ backgroundColor: "rgba(29,161,242,0.15)", border: "1px solid rgba(29,161,242,0.2)" }}
              >
                <XIcon className="h-3.5 w-3.5 text-[#1DA1F2]" />
                See all @shelbyserves posts
              </a>
            </div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}
