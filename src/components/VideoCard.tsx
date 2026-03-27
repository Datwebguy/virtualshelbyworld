"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Zap, Eye, Loader2, Heart, Share2, X, ShieldCheck } from "lucide-react";
import { useState, useRef, useMemo, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ShelbyVideo } from "@/lib/shelby";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getAccountAPTBalance } from "@/view-functions/getAccountBalance";
import { TIP_SYMBOL, APT_TIP_PRESETS, MIN_APT_FOR_GAS } from "@/lib/shelbyUSD";

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/** True if address is a full 64-hex-char Aptos address */
function isValidAddress(addr: string): boolean {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{64}$/.test(addr);
}

interface VideoCardProps {
  video: ShelbyVideo;
  index?: number;
  isLiked: boolean;
  onPlay: () => void;
  onLike: () => void;
  /** Parent passes this — it calls signAndSubmitTransaction → tipCreator; resolves to txHash */
  onQuickTip: (amountApt: number) => Promise<string>;
  showRank?: boolean;
}

const QUICK_AMOUNTS = APT_TIP_PRESETS;

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#E50914", "#ff6b35", "#FFD700", "#ffffff", "#ff4757"];

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  shape: "rect" | "circle";
}

function useConfettiParticles(count = 45): ConfettiParticle[] {
  return useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        duration: 1.6 + Math.random() * 1.4,
        delay: Math.random() * 0.5,
        rotate: Math.random() * 360,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}

function TipSuccessOverlay({
  creatorName,
  amount,
  txHash,
  senderAddr,
  onDone,
}: {
  creatorName: string;
  amount: number;
  txHash: string;
  senderAddr: string;
  onDone: () => void;
}) {
  const particles = useConfettiParticles();

  // Auto-dismiss after 5 s if no txHash, or 12 s if there is one (give time to click explorer link)
  const dismiss = useCallback(() => onDone(), [onDone]);
  useState(() => {
    const t = setTimeout(dismiss, txHash ? 12000 : 5000);
    return () => clearTimeout(t);
  });

  return (
    <motion.div
      className="fixed inset-0 z-[800] pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti rain */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.shape === "circle" ? p.size : p.size * 1.4,
            height: p.shape === "circle" ? p.size : p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : 2,
          }}
          initial={{ y: 0, rotate: p.rotate, opacity: 1 }}
          animate={{
            y: "108vh",
            rotate: p.rotate + 540,
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}

      {/* Success card — centered, pointer-events so user can tap to dismiss */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
        style={{ zIndex: 801 }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 14, stiffness: 280, delay: 0.05 }}
        onClick={onDone}
      >
        <div
          className="flex flex-col items-center gap-4 px-8 py-7 rounded-2xl border border-white/15 shadow-2xl text-center cursor-pointer select-none"
          style={{ background: "rgba(14,14,14,0.97)", minWidth: 300 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 300, delay: 0.15 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle, rgba(229,9,20,0.25) 0%, rgba(229,9,20,0.08) 100%)",
              border: "2px solid #E50914",
              boxShadow: "0 0 32px rgba(229,9,20,0.35)",
            }}
          >
            <Zap className="h-9 w-9" style={{ color: "#E50914" }} fill="#E50914" />
          </motion.div>

          <div>
            <motion.p
              className="text-white font-black text-2xl tracking-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              Tip Sent! ⚡
            </motion.p>
            <motion.p
              className="text-white/60 text-sm mt-1.5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <span className="text-white font-semibold">{amount} {TIP_SYMBOL}</span> went to{" "}
              <span style={{ color: "#E50914" }}>{creatorName}</span>
            </motion.p>
          </div>

          <motion.a
            href={
              txHash
                ? `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`
                : senderAddr
                ? `https://explorer.aptoslabs.com/account/${senderAddr}/transactions?network=testnet`
                : `https://explorer.aptoslabs.com/?network=testnet`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-125 active:scale-95"
            style={{
              color: "#fff",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={(e) => e.stopPropagation()}
          >
            🔗 View Transaction on Explorer
          </motion.a>

          <motion.p
            className="text-white/25 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Tap anywhere to close
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── VideoCard (memoized for scroll performance) ───────────────────────────────
export const VideoCard = memo(function VideoCard({
  video,
  index = 0,
  isLiked,
  onPlay,
  onLike,
  onQuickTip,
  showRank = false,
}: VideoCardProps) {
  const { account, connected } = useWallet();

  const addr = account?.address.toStringLong();

  // APT balance — covers both tip amount and gas
  const { data: balanceOctas } = useQuery({
    queryKey: ["apt-balance", addr],
    queryFn: () => getAccountAPTBalance({ accountAddress: addr! }),
    enabled: connected && !!addr,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const balanceAPT = balanceOctas !== undefined ? balanceOctas / 1e8 : null;

  const [hovered, setHovered] = useState(false);
  const [tipping, setTipping] = useState(false);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(0.5);
  const [customAmt, setCustomAmt] = useState("");
  const [confetti, setConfetti] = useState<{ amount: number; txHash: string; senderAddr: string } | null>(null);
  const { toast } = useToast();
  const customRef = useRef<HTMLInputElement>(null);

  // Is the connected wallet the same as this video's creator?
  const isSelfTip =
    connected &&
    !!account?.address &&
    account.address.toStringLong() === video.creator;

  // Is creator address verified (full 64-char hex)?
  const isVerified = isValidAddress(video.creator);

  const resolvedAmt = (): number => {
    if (customAmt !== "") {
      const v = parseFloat(customAmt);
      return isNaN(v) ? 0 : v;
    }
    return selected ?? 0;
  };

  const openTipModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelfTip || noCreatorWallet) return;
    setSelected(0.5);
    setCustomAmt("");
    setTipModalOpen(true);
  };

  // APT covers tip + gas — block if balance < tip + gas overhead
  const isInsufficientApt =
    balanceAPT !== null && resolvedAmt() > 0 &&
    balanceAPT < resolvedAmt() + MIN_APT_FOR_GAS;
  const isInsufficientBalance = isInsufficientApt;

  const handleSendTip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const amt = resolvedAmt();
    if (amt <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: `Enter a valid ${TIP_SYMBOL} amount greater than 0.` });
      return;
    }
    if (isInsufficientApt) {
      toast({ variant: "destructive", title: "Insufficient APT", description: `You need ${(amt + MIN_APT_FOR_GAS).toFixed(4)} APT (tip + gas). Get free testnet APT from the faucet.` });
      return;
    }
    setTipModalOpen(false);
    setTipping(true);
    try {
      const txHash = await onQuickTip(amt);
      // Debug: log the raw txHash so we can verify the wallet returns it
      console.log("[VSW] tip txHash:", txHash);
      setConfetti({ amount: amt, txHash: txHash ?? "", senderAddr: addr ?? "" });
    } catch {
      // error already toasted upstream
    } finally {
      setTipping(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}?v=${video.cid}`).catch(() => {});
    toast({ title: "Link copied!", description: `"${video.title}" share link copied.` });
  };

  // Tip button: disabled if tipping, self-tip, or creator has no valid wallet
  const noCreatorWallet = !isVerified;
  const tipDisabled = tipping || isSelfTip || noCreatorWallet;
  const tipLabel = isSelfTip
    ? "Your video"
    : noCreatorWallet
    ? "No wallet"
    : "Tip";
  const tipTitle = isSelfTip
    ? "You cannot tip your own video"
    : noCreatorWallet
    ? "Creator wallet not linked"
    : "Tip this creator";

  return (
    <>
      <motion.div
        className="flex-shrink-0 w-40 sm:w-52 cursor-pointer relative"
        style={{ scrollSnapAlign: "start", zIndex: hovered ? 20 : 1 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        <motion.div
          className="relative w-full h-24 sm:h-32 rounded-lg overflow-hidden border border-white/10"
          animate={{
            scale: hovered ? 1.1 : 1,
            boxShadow: hovered
              ? "0 24px 60px rgba(0,0,0,0.9), 0 0 28px rgba(229,9,20,0.28)"
              : "0 0 0px rgba(0,0,0,0)",
          }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        >
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            style={{
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.5s ease",
            }}
          />

          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-black/50 sm:bg-black/0 transition-opacity duration-200"
            style={{ opacity: hovered ? 1 : undefined }}
          />

          {/* Duration badge */}
          <div className="absolute bottom-1.5 right-1.5 text-xs text-white bg-black/70 px-1.5 py-0.5 rounded font-mono">
            {video.duration}
          </div>

          {/* Rank badge */}
          {showRank && (
            <div
              className="absolute top-1.5 left-2 font-black text-white"
              style={{ fontSize: "1.75rem", opacity: 0.15 }}
            >
              #{index + 1}
            </div>
          )}

          {/* ── Desktop hover overlay: description + actions ── */}
          <motion.div
            className="absolute inset-0 hidden sm:flex flex-col justify-end"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)" }}
          >
            {/* 2-line description */}
            <div className="px-2.5 pb-2 pt-1">
              <p className="text-white/75 text-[11px] leading-tight line-clamp-2 mb-2.5">
                {video.description}
              </p>
              {/* Actions row */}
              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={onPlay}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-black hover:scale-110 active:scale-90 transition-transform shadow-lg flex-shrink-0"
                  aria-label={`Play ${video.title}`}
                >
                  <Play className="h-4 w-4 fill-black ml-0.5" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={openTipModal}
                    disabled={tipDisabled}
                    title={tipTitle}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold text-white transition-all active:scale-90 shadow"
                    style={{
                      backgroundColor: tipDisabled && !tipping ? "rgba(255,255,255,0.15)" : "#E50914",
                      opacity: tipDisabled && !tipping ? 0.5 : 1,
                      cursor: tipDisabled ? "not-allowed" : "pointer",
                    }}
                    aria-label={tipLabel}
                  >
                    {tipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    {tipLabel}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 active:bg-white/40 text-white"
                    aria-label="Like"
                  >
                    <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 active:bg-white/40 text-white"
                    aria-label="Share"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Mobile action strip — always visible ── */}
          <div className="absolute bottom-0 left-0 right-0 sm:hidden flex items-center justify-between px-2 py-1.5 bg-gradient-to-t from-black/95 to-transparent">
            <button
              onClick={onPlay}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black active:scale-90 transition-transform shadow flex-shrink-0"
              aria-label={`Play ${video.title}`}
            >
              <Play className="h-3.5 w-3.5 fill-black ml-0.5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={openTipModal}
                disabled={tipDisabled}
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-bold text-white active:scale-90 disabled:opacity-50 flex-shrink-0"
                style={{ backgroundColor: tipDisabled ? "rgba(255,255,255,0.2)" : "#E50914" }}
                aria-label={tipLabel}
              >
                {tipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                {isSelfTip ? "Yours" : noCreatorWallet ? "—" : "Tip"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onLike(); }}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 active:bg-white/40 text-white flex-shrink-0"
                aria-label="Like"
              >
                <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 active:bg-white/40 text-white flex-shrink-0"
                aria-label="Share"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Meta ── */}
        <div className="mt-2 px-0.5">
          <p className="text-white text-sm font-semibold truncate leading-tight">{video.title}</p>
          <div className="flex items-center justify-between mt-0.5 gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-white/50 text-xs truncate">{video.creatorName}</span>
              {isVerified && (
                <span title="Verified creator on Aptos Testnet">
                  <ShieldCheck
                    className="h-3 w-3 flex-shrink-0"
                    style={{ color: "#E50914" }}
                  />
                </span>
              )}
              {isSelfTip && (
                <span
                  className="text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                  style={{ backgroundColor: "rgba(229,9,20,0.2)", color: "#E50914" }}
                >
                  YOU
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isLiked && <Heart className="h-2.5 w-2.5 text-red-400 fill-red-400" />}
              <div className="flex items-center gap-0.5 text-white/40 text-xs">
                <Eye className="h-2.5 w-2.5" />
                {formatViews(video.views)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tip Amount Modal ── */}
      <AnimatePresence>
        {tipModalOpen && (
          <motion.div
            className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center px-0 sm:px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setTipModalOpen(false); }}
          >
            <div className="absolute inset-0 bg-black/75" />
            <motion.div
              className="relative w-full sm:w-96 rounded-t-2xl sm:rounded-2xl border border-white/10 z-10 overflow-hidden"
              style={{ background: "rgba(18,18,18,0.98)" }}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar on mobile */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-5 pt-3 pb-6 sm:pt-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white font-bold text-base flex items-center gap-2">
                      <Zap className="h-4 w-4" style={{ color: "#E50914" }} />
                      Tip Creator
                    </p>
                    <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
                      {video.creatorName}
                      {isVerified && <ShieldCheck className="h-3 w-3" style={{ color: "#E50914" }} />}
                    </p>
                  </div>
                  <button
                    onClick={() => setTipModalOpen(false)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-white/40 active:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Quick amounts */}
                <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">Quick amounts ({TIP_SYMBOL})</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {QUICK_AMOUNTS.map((amt) => {
                    const active = selected === amt && customAmt === "";
                    return (
                      <button
                        key={amt}
                        onClick={() => { setSelected(amt); setCustomAmt(""); }}
                        className="py-4 rounded-xl text-sm font-bold transition-all active:scale-95 border"
                        style={{
                          backgroundColor: active ? "rgba(229,9,20,0.2)" : "rgba(255,255,255,0.05)",
                          borderColor: active ? "#E50914" : "rgba(255,255,255,0.1)",
                          color: active ? "#E50914" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {amt}
                      </button>
                    );
                  })}
                </div>

                {/* Custom amount */}
                <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">Or type any amount</p>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: isInsufficientBalance ? "#E50914" : customAmt !== "" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
                  }}
                >
                  <span className="text-white/50 text-xs font-bold flex-shrink-0">{TIP_SYMBOL}</span>
                  <input
                    ref={customRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={customAmt}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setCustomAmt(val);
                      if (val !== "") setSelected(null);
                    }}
                    onFocus={() => { if (customAmt === "") setSelected(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                    className="flex-1 bg-transparent text-white text-right font-mono text-lg outline-none placeholder-white/25"
                    placeholder="0.00"
                  />
                </div>

                {/* Summary */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 mb-4"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <span className="text-white/50 text-xs">Sending to</span>
                  <span className="text-white text-xs font-semibold flex items-center gap-1">
                    {video.creatorName}
                    {isVerified && <ShieldCheck className="h-3 w-3" style={{ color: "#E50914" }} />}
                  </span>
                </div>

                {/* Balance warnings */}
                {isInsufficientApt && (
                  <p className="text-xs font-semibold mb-3 text-center" style={{ color: "#f59e0b" }}>
                    Insufficient APT — need {(resolvedAmt() + MIN_APT_FOR_GAS).toFixed(4)} APT (tip + gas).
                  </p>
                )}

                {/* Send button */}
                <button
                  onClick={handleSendTip}
                  disabled={tipping || resolvedAmt() <= 0 || isInsufficientBalance}
                  className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isInsufficientBalance ? "rgba(255,255,255,0.1)" : "#E50914",
                    color: isInsufficientBalance ? "rgba(255,255,255,0.35)" : "#fff",
                    cursor: isInsufficientBalance ? "not-allowed" : undefined,
                  }}
                >
                  {tipping ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Tip {resolvedAmt() > 0 ? `${resolvedAmt()} ${TIP_SYMBOL}` : TIP_SYMBOL}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confetti / Success overlay ── */}
      <AnimatePresence>
        {confetti && (
          <TipSuccessOverlay
            creatorName={video.creatorName}
            amount={confetti.amount}
            txHash={confetti.txHash}
            senderAddr={confetti.senderAddr}
            onDone={() => setConfetti(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
});
