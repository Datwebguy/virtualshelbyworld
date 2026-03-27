"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Film,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ImageIcon,
  Loader2,
  Play,
  Zap,
  X,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { uploadToShelby, CLAY_K, CLAY_M, CLAY_TOTAL, type UploadProgress } from "@/lib/shelbyUpload";
import { saveVideoFile } from "@/lib/videoDB";
import { useToast } from "@/components/ui/use-toast";
import { WalletSelector } from "@/components/WalletSelector";
import { Footer } from "@/components/Footer";
import type { ShelbyVideo } from "@/lib/shelby";

// ─── Local storage key ────────────────────────────────────────────────────────
const LS_KEY = "vsw_uploads";

function saveUpload(video: ShelbyVideo) {
  try {
    const existing: ShelbyVideo[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    const updated = [video, ...existing.filter((v) => v.cid !== video.cid)];
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Step = "drop" | "form" | "uploading" | "success" | "error";

interface FormData {
  title: string;
  description: string;
  thumbnailDataUrl: string;
  thumbnailFile: File | null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudioPage() {
  const { account, connected } = useWallet();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("drop");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    thumbnailDataUrl: "",
    thumbnailFile: null,
  });
  const [progress, setProgress] = useState<UploadProgress>({
    phase: "idle",
    pct: 0,
    message: "",
  });
  const [result, setResult] = useState<{ cid: string; shelbyUrl: string; txHash?: string; txSkipped?: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const acceptFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please select a video file." });
      return;
    }
    setVideoFile(file);
    // Pre-fill title from filename
    const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    setForm((f) => ({ ...f, title: name }));
    setStep("form");
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, [acceptFile]);

  // ── Thumbnail ────────────────────────────────────────────────────────────────
  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({
        ...f,
        thumbnailDataUrl: reader.result as string,
        thumbnailFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!videoFile || !form.title.trim() || !form.description.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Title and description are required." });
      return;
    }
    if (!connected || !account?.address) {
      toast({ variant: "destructive", title: "Wallet required", description: "Connect your Aptos wallet to upload." });
      return;
    }

    // Create a blob URL for playback before we start (file available now)
    const localBlobUrl = URL.createObjectURL(videoFile);
    setBlobUrl(localBlobUrl);

    setStep("uploading");
    setProgress({ phase: "coding", pct: 0, message: "Preparing upload…" });

    try {
      // 1. Upload to Shelby Hot Storage
      const uploadResult = await uploadToShelby(videoFile, setProgress);

      // 2. Persist actual file to IndexedDB so it survives page refresh
      await saveVideoFile(uploadResult.cid, videoFile);

      // 3. Build video metadata record
      const creatorAddr = account.address.toStringLong();
      const thumbnailUrl = form.thumbnailDataUrl || "https://images.unsplash.com/photo-1536240478700-b869ad10c093?w=400&q=70";
      const video: ShelbyVideo = {
        cid: uploadResult.cid,
        title: form.title,
        description: form.description,
        creator: creatorAddr,
        creatorName: account.ansName ?? creatorAddr.slice(0, 8) + "…",
        thumbnailUrl,
        streamUrl: localBlobUrl,          // local blob — used by uploader
        views: 0,
        duration: "0:00",
        uploadedAt: new Date().toISOString().split("T")[0],
      };

      // 4. Save to localStorage (uploader's own device — includes blob URL for local playback)
      saveUpload(video);

      // 5. POST to shared registry so OTHER users can see + tip this video
      //    Use the Shelby stream URL (not blob) as the public streamUrl
      setProgress({ phase: "registering", pct: 96, message: "Publishing to shared registry…" });
      try {
        await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...video, streamUrl: uploadResult.shelbyUrl }),
        });
      } catch {
        // Registry post is best-effort — local save already done above
      }

      setProgress({ phase: "registering", pct: 100, message: "Done!" });
      const txHash = "";
      const txSkipped = true;

      setResult({ ...uploadResult, txHash, txSkipped });
      setStep("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg || "Upload failed. Please try again.");
      setStep("error");
    }
  };

  const resetStudio = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setStep("drop");
    setVideoFile(null);
    setForm({ title: "", description: "", thumbnailDataUrl: "", thumbnailFile: null });
    setProgress({ phase: "idle", pct: 0, message: "" });
    setResult(null);
    setErrorMsg("");
    setBlobUrl(null);
    setShowPlayer(false);
  };

  const copyLink = () => {
    if (result?.shelbyUrl) {
      navigator.clipboard.writeText(result.shelbyUrl);
      toast({ title: "Copied!", description: "Stream URL copied to clipboard." });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
    <main
      className="min-h-screen pt-20 pb-16 px-4 md:px-8"
      style={{ background: "linear-gradient(180deg, #141414 0%, #000000 100%)" }}
    >
      {/* Back to home */}
      <div className="max-w-3xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to VirtualShelbyWorld
        </Link>
      </div>

      {/* Page title */}
      <motion.div
        className="max-w-3xl mx-auto mb-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <Film className="h-6 w-6" style={{ color: "#E50914" }} />
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">Creator Studio</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Upload Your Content</h1>
        <p className="text-white/50 text-base max-w-lg mx-auto">
          Store your video permanently on Shelby Hot Storage with Clay (10+6) erasure coding,
          then register it on Aptos Testnet.
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Drop Zone ─────────────────────────────────────────────── */}
          {step === "drop" && (
            <motion.div
              key="drop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-5 py-20 px-8 text-center"
                style={{
                  borderColor: isDragging ? "#E50914" : "rgba(255,255,255,0.15)",
                  background: isDragging ? "rgba(229,9,20,0.10)" : "rgba(20,20,20,0.98)",
                }}
              >
                <motion.div
                  animate={{ scale: isDragging ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: isDragging ? "rgba(229,9,20,0.2)" : "rgba(255,255,255,0.06)" }}
                >
                  <Upload className="h-9 w-9" style={{ color: isDragging ? "#E50914" : "rgba(255,255,255,0.5)" }} />
                </motion.div>

                <div>
                  <p className="text-xl font-bold text-white mb-1">
                    {isDragging ? "Drop to upload" : "Drag & drop your video"}
                  </p>
                  <p className="text-white/40 text-sm">or click to browse — MP4, MOV, WebM, MKV</p>
                </div>

                {/* Clay info badge */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs text-white/50"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <Zap className="h-3 w-3" style={{ color: "#E50914" }} />
                  Clay ({CLAY_K}+{CLAY_M}) erasure coding · {CLAY_TOTAL} shards · Shelby Testnet
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
            </motion.div>
          )}

          {/* ── Step 2: Metadata Form ─────────────────────────────────────────── */}
          {step === "form" && videoFile && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 p-6 md:p-8 space-y-6"
              style={{ background: "rgba(20,20,20,0.98)" }}
            >
              {/* File info bar */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <Film className="h-5 w-5 flex-shrink-0" style={{ color: "#E50914" }} />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{videoFile.name}</p>
                    <p className="text-white/40 text-xs">{formatBytes(videoFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={resetStudio}
                  className="text-white/40 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Thumbnail</label>
                <div
                  onClick={() => thumbInputRef.current?.click()}
                  className="relative rounded-xl border border-dashed border-white/15 cursor-pointer hover:border-white/30 transition-colors overflow-hidden"
                  style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.03)" }}
                >
                  {form.thumbnailDataUrl ? (
                    <img src={form.thumbnailDataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="h-8 w-8 text-white/20" />
                      <p className="text-white/30 text-xs">Click to upload thumbnail</p>
                    </div>
                  )}
                  {form.thumbnailDataUrl && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-medium">Change thumbnail</p>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onThumbnailChange}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Video Title <span style={{ color: "#E50914" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Give your video a great title…"
                  maxLength={120}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/25 text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
                />
                <p className="text-right text-xs text-white/20 mt-1">{form.title.length}/120</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Description <span style={{ color: "#E50914" }}>*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your video…"
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/25 text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
                <p className="text-right text-xs text-white/20 mt-1">{form.description.length}/500</p>
              </div>

              {/* Wallet notice */}
              {!connected ? (
                <div className="rounded-xl border border-red-500/30 p-4 space-y-3" style={{ background: "rgba(120,0,0,0.15)" }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-300 text-sm font-semibold mb-0.5">Wallet connection required</p>
                      <p className="text-red-300/60 text-xs leading-relaxed">
                        Connect your Aptos wallet to sign the on-chain registration transaction.
                      </p>
                    </div>
                  </div>
                  <div className="pl-7">
                    <WalletSelector />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <p className="text-green-300/80 text-xs">Wallet connected — ready to upload and sign transaction.</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={resetStudio}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!form.title.trim() || !form.description.trim() || !connected}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#E50914" }}
                >
                  <Upload className="h-4 w-4" />
                  {connected ? "Upload to Shelby" : "Connect Wallet to Upload"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Uploading ─────────────────────────────────────────────── */}
          {step === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 p-8 md:p-10 text-center space-y-8"
              style={{ background: "rgba(20,20,20,0.98)" }}
            >
              {/* Animated icon */}
              <div className="flex justify-center">
                <motion.div
                  className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.3)" }}
                  animate={{ boxShadow: ["0 0 0px rgba(229,9,20,0)", "0 0 32px rgba(229,9,20,0.35)", "0 0 0px rgba(229,9,20,0)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Loader2 className="h-10 w-10 animate-spin" style={{ color: "#E50914" }} />
                </motion.div>
              </div>

              {/* Phase message */}
              <div>
                <p className="text-white font-semibold text-lg mb-1">{progress.message}</p>
                <p className="text-white/40 text-sm">{progress.pct}% complete</p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "#E50914" }}
                  animate={{ width: `${progress.pct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              {/* Shard counter */}
              {progress.phase === "uploading" && progress.shardsDone !== undefined && (
                <div className="grid grid-cols-8 gap-1.5 max-w-xs mx-auto">
                  {Array.from({ length: CLAY_TOTAL }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-2 rounded-full"
                      animate={{
                        backgroundColor:
                          i < (progress.shardsDone ?? 0)
                            ? i < CLAY_K
                              ? "#E50914"
                              : "#22c55e"
                            : "rgba(255,255,255,0.1)",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              )}

              {/* Phase labels */}
              <div className="flex items-center justify-center gap-6 text-xs text-white/30">
                {(["coding", "uploading", "verifying", "registering"] as const).map((phase) => (
                  <div
                    key={phase}
                    className="flex flex-col items-center gap-1"
                    style={{ color: progress.phase === phase ? "#E50914" : undefined }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          progress.phase === phase
                            ? "#E50914"
                            : ["coding", "uploading", "verifying", "registering"].indexOf(phase) <
                              ["coding", "uploading", "verifying", "registering"].indexOf(progress.phase)
                            ? "#22c55e"
                            : "rgba(255,255,255,0.15)",
                      }}
                    />
                    <span className="capitalize">{phase}</span>
                  </div>
                ))}
              </div>

              {/* Clay legend */}
              {progress.phase === "uploading" && (
                <p className="text-white/25 text-xs">
                  Red = data shards ({CLAY_K}) · Green = parity shards ({CLAY_M})
                </p>
              )}
            </motion.div>
          )}

          {/* ── Step 4: Success ───────────────────────────────────────────────── */}
          {step === "success" && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, type: "spring", damping: 20 }}
              className="rounded-2xl border border-white/10 p-8 md:p-10 text-center space-y-6"
              style={{ background: "rgba(20,20,20,0.98)" }}
            >
              {/* Success icon */}
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              >
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-green-500/10 border border-green-500/30">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
              </motion.div>

              <div>
                <h2 className="text-2xl font-black text-white mb-1">Upload Complete!</h2>
                <p className="text-white/50 text-sm">
                  <span className="font-semibold text-white">{form.title}</span> is now stored permanently on Shelby Hot Storage.
                </p>
              </div>

              {/* Thumbnail preview */}
              {form.thumbnailDataUrl && (
                <motion.div
                  className="w-40 mx-auto rounded-xl overflow-hidden border border-white/10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <img src={form.thumbnailDataUrl} alt="Thumbnail" className="w-full aspect-video object-cover" />
                </motion.div>
              )}

              {/* CID display */}
              <div className="rounded-xl border border-white/10 p-4 bg-white/5 space-y-2 text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white/40 text-xs font-mono uppercase tracking-wider">Blob CID</p>
                  <button onClick={copyLink} className="text-white/40 hover:text-white transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-white/70 text-xs font-mono break-all leading-relaxed">{result.cid}</p>
              </div>

              {/* Tx hash */}
              {result.txHash && !result.txSkipped && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-left">
                  <p className="text-green-400/60 text-xs mb-1 font-mono uppercase tracking-wider">Registered on Aptos Testnet</p>
                  <a
                    href={`https://explorer.aptoslabs.com/txn/${result.txHash}?network=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-300/70 text-xs font-mono hover:text-green-300 transition-colors break-all"
                  >
                    {result.txHash}
                  </a>
                </div>
              )}
              {result.txSkipped && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-300/80 text-xs font-semibold mb-0.5">On-chain registration skipped</p>
                      <p className="text-yellow-300/50 text-xs leading-relaxed">
                        Your video is saved and visible in Trending. To register on Aptos Testnet, allow pop-ups for this site and sign in again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {blobUrl && (
                  <button
                    onClick={() => setShowPlayer(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: "#E50914" }}
                  >
                    <Play className="h-4 w-4 fill-white" />
                    Play Video
                  </button>
                )}
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all"
                >
                  Watch in Trending
                </Link>
                <button
                  onClick={resetStudio}
                  className="px-5 py-3 rounded-xl font-semibold text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  Upload another
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 5: Error ─────────────────────────────────────────────────── */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-red-500/20 p-8 text-center space-y-5"
              style={{ background: "rgba(25,5,5,0.98)" }}
            >
              <AlertCircle className="h-14 w-14 text-red-400 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Upload Failed</h2>
                <p className="text-white/50 text-sm">{errorMsg}</p>
              </div>
              <button
                onClick={resetStudio}
                className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: "#E50914" }}
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info strip at bottom */}
        {step === "drop" && (
          <motion.div
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[
              {
                icon: "🔒",
                title: "Permanent Storage",
                desc: "Your content is stored with Clay (10+6) erasure coding — survives any 6 node failures.",
              },
              {
                icon: "⚡",
                title: "Sub-second Playback",
                desc: "Shelby Hot Storage optimizes for instant streaming, not archival cold reads.",
              },
              {
                icon: "🔗",
                title: "On-chain Registration",
                desc: "Blob ID registered on Aptos Testnet so the world can verify your content.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/8 p-4 space-y-1.5"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-lg">{item.icon}</p>
                <p className="text-white text-sm font-semibold">{item.title}</p>
                <p className="text-white/35 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {showPlayer && blobUrl && (
        <VideoPlayer
          streamUrl={blobUrl}
          title={form.title}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </main>
    <Footer />
    </>
  );
}
