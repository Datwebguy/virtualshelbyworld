"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CheckCircle, AlertCircle, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { useState, useMemo } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { tipCreator, aptToOctas } from "@/entry-functions/tipCreator";
import { getAccountAPTBalance } from "@/view-functions/getAccountBalance";
import {
  TIP_SYMBOL,
  APT_TIP_PRESETS,
  APT_FAUCET_URL,
  MIN_APT_FOR_GAS,
} from "@/lib/shelbyUSD";

const CONFETTI_COLORS = ["#E50914", "#ff6b35", "#FFD700", "#ffffff", "#ff4757"];

interface TipModalProps {
  creatorName: string;
  creatorAddress: string;
  onClose: () => void;
}

type TxStatus = "idle" | "loading" | "success" | "error";

function ConfettiRain() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 7,
        duration: 1.5 + Math.random() * 1.5,
        delay: Math.random() * 0.5,
        rotate: Math.random() * 360,
        circle: Math.random() > 0.5,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`, top: -12,
            width: p.circle ? p.size : p.size * 1.4,
            height: p.circle ? p.size : p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: p.circle ? "50%" : 2,
          }}
          initial={{ y: 0, rotate: p.rotate, opacity: 1 }}
          animate={{ y: 320, rotate: p.rotate + 540, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function TipModal({ creatorName, creatorAddress, onClose }: TipModalProps) {
  const { signAndSubmitTransaction, connected, account } = useWallet();
  const [amount, setAmount] = useState(APT_TIP_PRESETS[1]);
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const addr = account?.address.toStringLong();
  const resolvedAmount = custom ? parseFloat(custom) || 0 : amount;
  const isSelf = connected && addr === creatorAddress;

  const { data: aptOctas, isLoading: aptLoading } = useQuery({
    queryKey: ["apt-balance", addr],
    queryFn: () => getAccountAPTBalance({ accountAddress: addr! }),
    enabled: connected && !!addr,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
  const aptBalance = aptOctas !== undefined ? aptOctas / 1e8 : null;

  // Need enough APT for the tip amount + gas overhead
  const insufficientApt =
    aptBalance !== null && resolvedAmount > 0 &&
    aptBalance < resolvedAmount + MIN_APT_FOR_GAS;
  const balancesLoaded = !aptLoading;
  const canTip = connected && !isSelf && resolvedAmount > 0 && balancesLoaded && !insufficientApt;

  const handleTip = async () => {
    if (!canTip) return;
    setStatus("loading");
    setErrMsg("");
    try {
      // Pre-flight: fresh APT balance check
      if (addr) {
        const res = await getAccountAPTBalance({ accountAddress: addr });
        const liveApt = res / 1e8;
        if (liveApt < resolvedAmount + MIN_APT_FOR_GAS) {
          setErrMsg(`Insufficient APT. You have ${liveApt.toFixed(4)} APT but need ${(resolvedAmount + MIN_APT_FOR_GAS).toFixed(4)} APT (tip + gas).`);
          setStatus("error");
          return;
        }
      }
      const response = await signAndSubmitTransaction(
        tipCreator({ creatorAddress, amountOctas: aptToOctas(resolvedAmount) })
      );
      setTxHash(response?.hash ?? "");
      setStatus("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isExpired = /expired|session|keyless|ephemeral|oidc|sign.?in/i.test(msg);
      const isPopup = /prompt|popup|window|blocked|open/i.test(msg);
      const isInsufficient = /insufficient|balance|gas|fund|withdraw|transfer/i.test(msg);
      setErrMsg(
        isExpired
          ? "Your session expired. Please sign in again."
          : isPopup
          ? "Signing window was blocked. Allow pop-ups for this site and try again."
          : isInsufficient
          ? `Insufficient APT balance. Get free testnet APT from the faucet.`
          : msg || "Transaction failed or was rejected."
      );
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center px-0 sm:px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <motion.div
          className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: "rgba(20,20,20,0.99)" }}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — mobile */}
          <div className="sm:hidden flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          {/* Close button — 44px */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 active:bg-white/20 text-white/60 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* ── Success ── */}
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center relative">
              <ConfettiRain />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="relative z-10">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-white relative z-10">Tip Sent! ⚡</h3>
              <p className="text-white/60 text-sm relative z-10">
                You tipped <span className="text-white font-semibold">{resolvedAmount} {TIP_SYMBOL}</span> to{" "}
                <span style={{ color: "#E50914" }}>{creatorName}</span>
              </p>
              <a
                href={
                  txHash
                    ? `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`
                    : `https://explorer.aptoslabs.com/?network=testnet`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 active:opacity-80 relative z-10"
                style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
                onClick={(e) => e.stopPropagation()}
              >
                🔗 View Transaction on Explorer
              </a>
              <button onClick={onClose} className="w-full py-4 rounded-xl text-white font-semibold text-sm bg-white/10 active:bg-white/20 transition-all relative z-10">
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(229,9,20,0.15)" }}>
                  <Zap className="h-5 w-5" style={{ color: "#E50914" }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Tip with {TIP_SYMBOL}</h3>
                  <p className="text-white/50 text-xs flex items-center gap-1">
                    {creatorName}
                    <ShieldCheck className="h-3 w-3" style={{ color: "#E50914" }} />
                  </p>
                </div>
              </div>

              {/* APT balance row */}
              {connected && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: insufficientApt ? "#f59e0b" : "rgba(255,255,255,0.1)",
                  }}
                >
                  <Wallet className="h-3.5 w-3.5 flex-shrink-0" style={{ color: insufficientApt ? "#f59e0b" : "rgba(255,255,255,0.4)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white/40 text-[9px] uppercase tracking-wider">APT Balance (tip + gas)</p>
                    <p className="text-sm font-bold" style={{ color: insufficientApt ? "#f59e0b" : "#fff" }}>
                      {aptLoading ? "…" : aptBalance !== null ? aptBalance.toFixed(4) : "—"} APT
                    </p>
                  </div>
                  {insufficientApt && (
                    <a
                      href={APT_FAUCET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 flex-shrink-0 underline underline-offset-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Get APT
                    </a>
                  )}
                </div>
              )}

              {/* Presets */}
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">Quick amounts ({TIP_SYMBOL})</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {APT_TIP_PRESETS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustom(""); }}
                    className="py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 border"
                    style={{
                      backgroundColor: amount === a && !custom ? "rgba(229,9,20,0.2)" : "rgba(255,255,255,0.05)",
                      borderColor: amount === a && !custom ? "#E50914" : "rgba(255,255,255,0.1)",
                      color: amount === a && !custom ? "#E50914" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg border mb-5 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: insufficientApt ? "#f59e0b" : custom !== "" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
                }}
              >
                <span className="text-white/50 text-xs font-bold flex-shrink-0">{TIP_SYMBOL}</span>
                <input
                  type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*"
                  placeholder="Custom amount"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="flex-1 bg-transparent text-white text-right font-mono text-base outline-none placeholder-white/25"
                />
              </div>

              {/* Warnings */}
              {isSelf && (
                <div className="flex items-center gap-2 mb-4 text-yellow-400 text-xs bg-yellow-400/10 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>You cannot tip your own video.</span>
                </div>
              )}
              {insufficientApt && (
                <div className="flex items-center gap-2 mb-4 text-yellow-400 text-xs bg-yellow-400/10 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Insufficient APT.{" "}
                    <a href={APT_FAUCET_URL} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-yellow-300">
                      Get free testnet APT ↗
                    </a>
                  </span>
                </div>
              )}
              {status === "error" && (
                <div className="flex flex-col gap-1 mb-4 bg-red-400/10 rounded-lg px-3 py-2.5">
                  <div className="flex items-start gap-2 text-red-400 text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{errMsg}</span>
                  </div>
                  {/insufficient|balance/i.test(errMsg) && (
                    <a
                      href={APT_FAUCET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-6 text-xs font-bold text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      → Get free testnet APT ↗
                    </a>
                  )}
                </div>
              )}

              {/* Button */}
              <button
                onClick={handleTip}
                disabled={status === "loading" || !connected || !canTip}
                className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: insufficientApt ? "rgba(255,255,255,0.1)" : "#E50914",
                  color: insufficientApt ? "rgba(255,255,255,0.35)" : "#fff",
                }}
              >
                {status === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing…</>
                ) : (
                  <><Zap className="h-4 w-4" /> Tip {resolvedAmount > 0 ? `${resolvedAmount} ` : ""}{TIP_SYMBOL}</>
                )}
              </button>

              {!connected && (
                <p className="text-center text-white/40 text-xs mt-3">Sign in with Google to tip creators</p>
              )}
              {connected && (
                <p className="text-center text-white/25 text-[10px] mt-3">
                  Tip paid in APT · gas ~{MIN_APT_FOR_GAS} APT
                </p>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
