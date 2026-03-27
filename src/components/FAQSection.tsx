"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "What is VirtualShelbyWorld?",
    a: "VirtualShelbyWorld is a decentralized video streaming platform — 'Netflix for Web3' — built on Shelby Hot Storage and Aptos Testnet. Anyone can upload, stream, and earn APT from their content without relying on a centralized company.",
  },
  {
    q: "What is Shelby Hot Storage?",
    a: "Shelby Hot Storage is a high-performance decentralized storage protocol that uses Clay (10+6) erasure coding. Your video is split into 16 shards across independent nodes — 10 data shards + 6 parity shards — so playback is instant and content survives any 6 node failures.",
  },
  {
    q: "How do I earn APT from my videos?",
    a: "Once your video is uploaded, viewers can tip you any amount of APT directly from the video card or player. Tips are sent on-chain via Aptos Testnet — the APT goes straight to your connected wallet with no platform fees.",
  },
  {
    q: "How do I upload a video?",
    a: "Click 'Upload Your Video' from the homepage or go to Creator Studio. Drop your video file (MP4, MOV, WebM, MKV), fill in the title and description, connect your Aptos wallet, then hit Upload. Your content is encoded and stored permanently on Shelby Hot Storage.",
  },
  {
    q: "What wallet do I need?",
    a: "VirtualShelbyWorld uses Aptos Keyless — you sign in with Google (or Apple) and a wallet address is automatically created for you on Aptos Testnet. No seed phrase required. You can also use Petra wallet.",
  },
  {
    q: "Can my videos be taken down?",
    a: "No. Once uploaded, your video's Blob ID is registered on-chain and stored across Shelby's decentralised node network. There is no central authority that can remove your content — it is permanent and censorship-resistant.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="px-6 md:px-14 py-16 md:py-20 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          className="text-2xl md:text-4xl font-black text-white mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="flex flex-col gap-2">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors"
                  style={{
                    background: isOpen ? "rgba(229,9,20,0.08)" : "rgba(45,45,45,0.9)",
                    borderBottom: "2px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span className="text-white font-semibold text-base md:text-lg leading-snug">
                    {faq.q}
                  </span>
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: isOpen ? "#E50914" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {isOpen ? (
                      <X className="h-4 w-4 text-white" />
                    ) : (
                      <Plus className="h-4 w-4 text-white" />
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        className="px-6 py-5 text-white/60 text-sm md:text-base leading-relaxed"
                        style={{ background: "rgba(229,9,20,0.05)", borderBottom: "2px solid rgba(229,9,20,0.12)" }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
