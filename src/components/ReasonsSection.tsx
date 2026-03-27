"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Coins, Globe } from "lucide-react";

const REASONS = [
  {
    icon: <Globe className="h-8 w-8" />,
    iconBg: "rgba(59,130,246,0.15)",
    iconColor: "#60a5fa",
    title: "Stream Everywhere",
    desc: "Watch on any device — phone, tablet, laptop, or TV. Shelby Hot Storage delivers sub-second playback anywhere in the world.",
    emoji: "🌐",
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    iconBg: "rgba(34,197,94,0.15)",
    iconColor: "#4ade80",
    title: "Permanent Storage",
    desc: "Your videos are encoded with Clay (10+6) erasure coding across 16 shards. Content survives even if 6 storage nodes go offline.",
    emoji: "🔒",
  },
  {
    icon: <Coins className="h-8 w-8" />,
    iconBg: "rgba(234,179,8,0.15)",
    iconColor: "#facc15",
    title: "Earn APT Directly",
    desc: "Viewers tip creators in real APT on Aptos Testnet. Payments go straight to your wallet — no platform cut, no delays.",
    emoji: "⚡",
  },
  {
    icon: <Zap className="h-8 w-8" />,
    iconBg: "rgba(229,9,20,0.15)",
    iconColor: "#E50914",
    title: "Censorship-Free",
    desc: "No middlemen. No takedowns. Your content is registered on-chain and cannot be removed by any single party.",
    emoji: "🔗",
  },
];

export function ReasonsSection() {
  return (
    <section className="px-6 md:px-14 py-16 md:py-20 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          className="mb-10 md:mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
            More Reasons to Join
          </h2>
          <p className="text-white/40 text-sm md:text-base max-w-xl">
            VirtualShelbyWorld is built differently — a platform that works for creators, not against them.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REASONS.map((r, i) => (
            <motion.div
              key={r.title}
              className="relative rounded-2xl border border-white/8 p-6 flex flex-col gap-4 overflow-hidden group"
              style={{ background: "rgba(255,255,255,0.03)" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}
            >
              {/* Large background emoji */}
              <div
                className="absolute bottom-3 right-4 text-5xl md:text-6xl select-none pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{ opacity: 0.12 }}
              >
                {r.emoji}
              </div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: r.iconBg, color: r.iconColor }}
              >
                {r.icon}
              </div>

              {/* Text */}
              <div>
                <p className="text-white font-bold text-base mb-2 leading-snug">{r.title}</p>
                <p className="text-white/45 text-sm leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
