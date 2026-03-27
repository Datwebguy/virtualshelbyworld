"use client";

import Link from "next/link";
import { Twitter, ExternalLink } from "lucide-react";

// ─── Link data ────────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    heading: "Platform",
    items: [
      { label: "Home", href: "/", external: false, tooltip: null },
      { label: "Creator Studio", href: "/studio", external: false, tooltip: null },
      { label: "Trending Now", href: "/#trending", external: false, tooltip: null },
      { label: "Browse Categories", href: "/#browse", external: false, tooltip: null },
      { label: "My Uploads", href: "/#uploads", external: false, tooltip: null },
    ],
  },
  {
    heading: "Technology",
    items: [
      {
        label: "Shelby Hot Storage",
        href: "https://rpc.testnet.shelby.xyz",
        external: true,
        tooltip: "Live RPC Gateway — check node status",
      },
      {
        label: "Aptos Testnet",
        href: "https://explorer.aptoslabs.com/?network=testnet",
        external: true,
        tooltip: "Aptos Testnet block explorer",
      },
      {
        label: "Clay Erasure Coding",
        href: "https://x.com/shelbyserves",
        external: true,
        tooltip: "Videos split into 16 shards (10 data + 6 parity) — survives any 6 node failures",
      },
      {
        label: "Aptos Keyless",
        href: "https://aptos.dev/en/build/guides/aptos-keyless/intro",
        external: true,
        tooltip: "Sign in with Google — no seed phrase needed",
      },
    ],
  },
  {
    heading: "Community",
    items: [
      {
        label: "@shelbyserves",
        href: "https://x.com/shelbyserves",
        external: true,
        tooltip: "Official Shelby Protocol X account",
      },
      {
        label: "@Datweb3guy",
        href: "https://x.com/Datweb3guy",
        external: true,
        tooltip: "Creator of VirtualShelbyWorld",
      },
      {
        label: "Get Test APT",
        href: "https://aptos.dev/network/faucet",
        external: true,
        tooltip: "Fund your Testnet wallet for free",
      },
    ],
  },
  {
    heading: "Help",
    items: [
      { label: "How to Upload", href: "/studio", external: false, tooltip: null },
      { label: "How to Earn APT", href: "/#uploads", external: false, tooltip: null },
      {
        label: "Petra Wallet",
        href: "https://petra.app",
        external: true,
        tooltip: "Install the Petra browser extension",
      },
      {
        label: "Aptos Connect",
        href: "https://aptosconnect.app",
        external: true,
        tooltip: "Connect via Google with Aptos Keyless",
      },
    ],
  },
];

// ─── Single link item with optional tooltip ───────────────────────────────────
function FooterLink({
  label,
  href,
  external,
  tooltip,
}: {
  label: string;
  href: string;
  external: boolean;
  tooltip: string | null;
}) {
  const cls =
    "group/link relative inline-flex items-center gap-1 text-sm transition-colors duration-200 cursor-pointer"
    + " text-[#999999] hover:text-[#E50914]";

  const inner = (
    <>
      {label}
      {external && <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />}
      {/* Tooltip */}
      {tooltip && (
        <span
          className="pointer-events-none absolute left-0 bottom-full mb-2 w-56 rounded-lg px-3 py-2 text-xs text-white/80 leading-relaxed
                     opacity-0 group-hover/link:opacity-100 transition-opacity duration-200 z-50"
          style={{ background: "#1a1a1a", border: "1px solid #333", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
        >
          {tooltip}
          <span
            className="absolute left-3 top-full w-0 h-0"
            style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1a1a1a" }}
          />
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer
      className="mt-8 px-6 md:px-14 pt-12 pb-8"
      style={{ background: "#000000", borderTop: "1px solid #333333" }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Questions row */}
        <p className="text-sm mb-10" style={{ color: "#999999" }}>
          Questions?{" "}
          <a
            href="https://x.com/Datweb3guy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors duration-200 hover:text-[#E50914]"
            style={{ color: "#999999" }}
          >
            Contact us on X
          </a>
        </p>

        {/* 4-column link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10 mb-12">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: "#ffffff" }}
              >
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <FooterLink
                      label={item.label}
                      href={item.href}
                      external={item.external}
                      tooltip={item.tooltip}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #333333" }} className="mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Brand logo left */}
          <div className="flex flex-col gap-1">
            <span
              className="text-xl font-black tracking-tight leading-none"
              style={{ color: "#E50914" }}
            >
              VirtualShelbyWorld
            </span>
            <span className="text-xs" style={{ color: "#555555" }}>
              © 2026 VirtualShelbyWorld. Powered by Shelby Protocol &amp; Aptos.
            </span>
          </div>

          {/* Social links right */}
          <div className="flex items-center gap-5">
            <a
              href="https://x.com/shelbyserves"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs transition-colors duration-200 hover:text-[#E50914]"
              style={{ color: "#666666" }}
            >
              <Twitter className="h-3.5 w-3.5" />
              @shelbyserves
            </a>
            <a
              href="https://x.com/Datweb3guy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs transition-colors duration-200 hover:text-[#E50914]"
              style={{ color: "#666666" }}
            >
              <Twitter className="h-3.5 w-3.5" />
              @Datweb3guy
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
