"use client";

import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TrendingRow } from "@/components/TrendingRow";
import { BrowseSection } from "@/components/BrowseSection";
import { UploadsRow } from "@/components/UploadsRow";
import { NewUploadsRow } from "@/components/NewUploadsRow";
import { ReasonsSection } from "@/components/ReasonsSection";
import { FAQSection } from "@/components/FAQSection";
import { ShelbyTwitterFeed } from "@/components/ShelbyTwitterFeed";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import type { ShelbyVideo } from "@/lib/shelby";

export default function App() {
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [watchHistory, setWatchHistory] = useState<ShelbyVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    try {
      const uploads = JSON.parse(localStorage.getItem("vsw_uploads") ?? "[]");
      setUploadCount(uploads.length);
    } catch {}
  }, []);

  const toggleLike = useCallback((cid: string) => {
    setLikedSet((prev) => {
      const next = new Set(prev);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });
  }, []);

  const addToHistory = useCallback((video: ShelbyVideo) => {
    setWatchHistory((prev) =>
      [video, ...prev.filter((v) => v.cid !== video.cid)].slice(0, 8)
    );
  }, []);

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #141414 0%, #000000 100%)" }}
    >
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        uploadCount={uploadCount}
      />

      <HeroSection />

      {/* ── 1. Trending on Shelby (curated videos) ── */}
      <TrendingRow
        likedSet={likedSet}
        onToggleLike={toggleLike}
        onWatch={addToHistory}
        searchQuery={searchQuery}
      />

      {/* ── 2. Browse categories + Continue Watching ── */}
      {!searchQuery && (
        <BrowseSection
          likedSet={likedSet}
          onToggleLike={toggleLike}
          onWatch={addToHistory}
          watchHistory={watchHistory}
        />
      )}

      {/* ── 3. New on Platform — all uploaded videos, public, newest first ── */}
      {!searchQuery && (
        <NewUploadsRow
          likedSet={likedSet}
          onToggleLike={toggleLike}
          onWatch={addToHistory}
        />
      )}

      {/* ── 4. My Uploads — wallet-gated, shows delete controls ── */}
      {!searchQuery && (
        <UploadsRow
          likedSet={likedSet}
          onToggleLike={toggleLike}
          onWatch={addToHistory}
        />
      )}

      {/* ── 5. Why VirtualShelbyWorld — feature cards ── */}
      {!searchQuery && <ReasonsSection />}

      {/* ── 5. CTA strip ── */}
      {!searchQuery && (
        <section className="px-6 md:px-14 py-12 border-t border-white/5">
          <div
            className="max-w-6xl mx-auto rounded-2xl border border-white/10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ background: "rgba(229,9,20,0.06)" }}
          >
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                Ready to upload your first video?
              </h3>
              <p className="text-white/50 text-sm md:text-base">
                Store permanently on Shelby · Earn APT from tips · Own your content forever.
              </p>
            </div>
            <Link
              href="/studio"
              className="flex-shrink-0 flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-all hover:brightness-110 hover:scale-105 active:scale-95 shadow-xl"
              style={{ backgroundColor: "#E50914", whiteSpace: "nowrap" }}
            >
              Get Started →
            </Link>
          </div>
        </section>
      )}

      {/* ── 6. FAQ ── */}
      {!searchQuery && <FAQSection />}

      {/* ── 7. Latest from @shelbyserves Twitter feed ── */}
      {!searchQuery && <ShelbyTwitterFeed />}

      <Footer />
    </main>
  );
}
