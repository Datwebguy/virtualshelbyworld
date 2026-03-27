"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useWallet, truncateAddress } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "./WalletSelector";
import { LogOut, User, Copy, Droplets, Search, X, Menu, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { getAccountAPTBalance } from "@/view-functions/getAccountBalance";
import { APT_FAUCET_URL } from "@/lib/shelbyUSD";


interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  uploadCount?: number;
}

export function Header({ searchQuery = "", onSearchChange, uploadCount = 0 }: HeaderProps) {
  const { account, connected, disconnect } = useWallet();
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isConnected = mounted && connected;
  const addr = account?.address.toStringLong();

  const copyAddress = useCallback(async () => {
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
      toast({ title: "Copied", description: "Wallet address copied to clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy address." });
    }
  }, [addr, toast]);

  const { data: balanceOctas } = useQuery({
    queryKey: ["apt-balance", addr],
    queryFn: () => getAccountAPTBalance({ accountAddress: addr! }),
    enabled: isConnected && !!addr,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const balanceAPT = balanceOctas !== undefined ? (balanceOctas / 1e8).toFixed(2) : null;

  const handleFaucet = useCallback(() => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toStringLong()).catch(() => {});
      toast({
        title: "Address copied!",
        description: "Paste your address on the faucet page to receive testnet APT.",
      });
    }
    window.open(APT_FAUCET_URL, "_blank", "noopener,noreferrer");
  }, [account?.address, toast]);

  const openMobileWallet = () => {
    setMobileMenuOpen(false);
    // Wait for menu close animation before showing wallet modal
    setTimeout(() => setWalletOpen(true), 300);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-[100] flex flex-col px-4 md:px-14 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(20,20,20,0.92)"
          : "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)",
        boxShadow: scrolled ? "0 1px 0 rgba(255,255,255,0.06)" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 select-none">
          <span
            className="text-lg md:text-3xl font-black tracking-tight"
            style={{ color: "#E50914" }}
          >
            VirtualShelbyWorld
          </span>
        </a>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="/" className="hover:text-white transition-colors font-medium">Home</a>
          <a href="/#browse" className="hover:text-white transition-colors">Browse</a>
          <a href="/#uploads" className="flex items-center gap-1.5 hover:text-white transition-colors">
            My Uploads
            {isConnected && uploadCount > 0 && (
              <span className="text-xs font-bold text-white bg-red-600 rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {uploadCount > 9 ? "9+" : uploadCount}
              </span>
            )}
          </a>
          <a
            href="/studio"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all hover:brightness-110 text-white"
            style={{ backgroundColor: "#E50914" }}
          >
            + Upload
          </a>
        </nav>

        {/* Search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className="absolute inset-x-0 top-0 z-10 flex items-center px-4 md:px-12 h-16"
              style={{ background: "rgba(0,0,0,0.96)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Search className="h-4 w-4 text-white/50 mr-3 flex-shrink-0" />
              <input
                ref={searchRef}
                autoFocus
                type="text"
                placeholder="Search titles, creators…"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-base"
              />
              <button
                onClick={() => { setSearchOpen(false); onSearchChange?.(""); }}
                className="ml-3 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth / wallet + mobile controls */}
        <div className="flex items-center gap-2">
          {/* Search toggle — 44px tap target */}
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 active:bg-white/30 text-white transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {isConnected && (
            <>
              {balanceAPT !== null && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm text-white font-mono">
                  <span className="text-white/40 text-xs">APT</span>
                  <span>{balanceAPT}</span>
                </div>
              )}
              <button
                onClick={handleFaucet}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95 border"
                style={{ backgroundColor: "rgba(229,9,20,0.15)", borderColor: "rgba(229,9,20,0.35)" }}
                title="Get free testnet APT — address auto-copied"
              >
                <Droplets className="h-3 w-3" style={{ color: "#E50914" }} />
                <span className="hidden lg:inline">Get APT</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </button>
            </>
          )}

          {/* Wallet — desktop only */}
          <div className="hidden md:block">
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">
                    <User className="h-4 w-4" />
                    {account?.ansName || truncateAddress(account?.address.toStringLong()) || "Account"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 border border-white/10 text-white">
                  <DropdownMenuItem onSelect={copyAddress} className="gap-2 hover:bg-white/10 cursor-pointer">
                    <Copy className="h-4 w-4" /> Copy address
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={disconnect} className="gap-2 hover:bg-white/10 cursor-pointer text-red-400">
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <WalletSelector />
            )}
          </div>

          {/* Hamburger — mobile only — 44px tap target */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-white/10 active:bg-white/30 text-white transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile slide-down menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/10"
            style={{ background: "rgba(10,10,10,0.98)" }}
          >
            <div className="flex flex-col py-2 px-2 gap-1">
              {[
                { href: "/", label: "Home" },
                { href: "/#browse", label: "Browse" },
                { href: "/#uploads", label: `My Uploads${isConnected && uploadCount > 0 ? ` (${uploadCount})` : ""}` },
                { href: "/studio", label: "+ Upload", red: true },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-4 rounded-xl text-base font-semibold transition-colors active:opacity-70 ${
                    item.red ? "text-white" : "text-white/80 active:bg-white/10"
                  }`}
                  style={item.red ? { backgroundColor: "#E50914" } : {}}
                >
                  {item.label}
                </a>
              ))}

              {/* Wallet section inside mobile menu */}
              <div className="px-4 pt-2 pb-1">
                {isConnected ? (
                  <div className="flex flex-col gap-2">
                    {balanceAPT !== null && (
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/10 bg-white/5">
                        <span className="text-white/50 text-sm">APT (tips + gas)</span>
                        <span className="font-mono text-white font-bold">{balanceAPT} APT</span>
                      </div>
                    )}
                    <button
                      onClick={() => { handleFaucet(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 border"
                      style={{ backgroundColor: "rgba(229,9,20,0.15)", borderColor: "rgba(229,9,20,0.35)" }}
                    >
                      <Droplets className="h-4 w-4" style={{ color: "#E50914" }} />
                      Get Test APT
                      <ExternalLink className="h-3.5 w-3.5 opacity-50 ml-auto" />
                    </button>
                    <button
                      onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 text-sm text-red-400 py-3 px-4 rounded-xl active:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                ) : (
                  /* Sign in button — closes menu first, then opens wallet modal safely */
                  <button
                    onClick={openMobileWallet}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: "#E50914" }}
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Wallet modal for mobile — rendered OUTSIDE the collapsing nav so it never unmounts */}
      {!isConnected && (
        <WalletSelector
          open={walletOpen}
          onOpenChange={setWalletOpen}
        />
      )}
    </motion.header>
  );
}
