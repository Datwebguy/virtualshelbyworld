"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import {
  PETRA_WEB_ACCOUNT_URL,
  AptosPrivacyPolicy,
  WalletItem,
  type AdapterWallet,
  type AdapterNotDetectedWallet,
  groupAndSortWallets,
  isPetraWebWallet,
  isInstallRequired,
  truncateAddress,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { ChevronDown, Copy, LogOut, User, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

// ─── Provider icons ────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" fill="#fff"/>
  </svg>
);

/** Determine icon + label for a Petra Web wallet by name */
function providerMeta(walletName: string): { icon: JSX.Element; label: string } {
  const lower = walletName.toLowerCase();
  if (lower.includes("apple")) {
    return { icon: <AppleIcon />, label: "Continue with Apple" };
  }
  return { icon: <GoogleIcon />, label: "Continue with Google" };
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface WalletSelectorProps {
  /** Called just before the modal opens — use to close parent menus */
  onBeforeOpen?: () => void;
  /** Controlled open state — when provided, the trigger button is hidden */
  open?: boolean;
  /** Called when the modal wants to close (controlled mode) */
  onOpenChange?: (open: boolean) => void;
}

// ─── Main component ────────────────────────────────────────────────────────────
export function WalletSelector({ onBeforeOpen, open: controlledOpen, onOpenChange }: WalletSelectorProps = {}) {
  const { account, connected, disconnect, wallet } = useWallet();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen! : internalOpen;

  const closeModal = useCallback(() => {
    if (isControlled) onOpenChange?.(false);
    else setInternalOpen(false);
  }, [isControlled, onOpenChange]);

  const openModal = useCallback(() => {
    onBeforeOpen?.();
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setTimeout(() => setInternalOpen(true), 60);
    }
  }, [isControlled, onBeforeOpen, onOpenChange]);

  const isConnected = mounted && connected;

  const copyAddress = useCallback(async () => {
    if (!account?.address.toStringLong()) return;
    try {
      await navigator.clipboard.writeText(account.address.toStringLong());
      toast({ title: "Copied", description: "Wallet address copied." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy." });
    }
  }, [account?.address, toast]);

  // Connected state — dropdown in uncontrolled (desktop) mode
  if (isConnected && !isControlled) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            {account?.ansName || truncateAddress(account?.address.toStringLong()) || "Unknown"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border border-white/10 text-white z-[500]" style={{ background: "#1a1a1a" }}>
          <DropdownMenuItem onSelect={copyAddress} className="gap-2 text-white focus:bg-white/10 focus:text-white cursor-pointer">
            <Copy className="h-4 w-4" /> Copy address
          </DropdownMenuItem>
          {wallet && isPetraWebWallet(wallet) && (
            <DropdownMenuItem asChild>
              <a
                href={PETRA_WEB_ACCOUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 text-white focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <User className="h-4 w-4" /> Account
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={disconnect} className="gap-2 text-red-400 focus:bg-white/10 focus:text-red-400 cursor-pointer">
            <LogOut className="h-4 w-4" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Controlled mode (mobile): only render the modal
  if (isControlled) {
    return (
      <AnimatePresence>
        {isOpen && <WalletModal onClose={closeModal} />}
      </AnimatePresence>
    );
  }

  // Uncontrolled mode (desktop): trigger button + modal
  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
        style={{ backgroundColor: "#E50914" }}
      >
        Sign In / Sign Up
      </button>

      <AnimatePresence>
        {isOpen && <WalletModal onClose={closeModal} />}
      </AnimatePresence>
    </>
  );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────
function WalletModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex: 500 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden"
        style={{ background: "#111111", zIndex: 501 }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* ── Permission header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-white/8">
          {/* App branding */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg"
              style={{ background: "linear-gradient(135deg, #E50914 0%, #8B0000 100%)", color: "#fff" }}
            >
              V
            </div>
            <div>
              <p className="text-white font-bold text-sm">VirtualShelbyWorld</p>
              <p className="text-white/40 text-xs">virtualshelbyworld.vercel.app</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors ml-auto p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Connection request title */}
          <p className="text-white font-bold text-xl mb-1">Connection request</p>
          <p className="text-white/50 text-sm leading-relaxed">
            Connecting your wallet will give VirtualShelbyWorld permission to do the following on{" "}
            <span className="text-white/70 font-semibold">Testnet</span>
          </p>

          {/* Permission list */}
          <div className="mt-4 flex flex-col gap-2.5">
            {[
              "View your balance and activity",
              "Request approval for transactions",
              "Tip creators with ShelbyUSD",
              "Register videos on Aptos Testnet",
            ].map((perm) => (
              <div key={perm} className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(229,9,20,0.9)" }}
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-white/75 text-sm">{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Wallet options ── */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-1">Choose sign-in method</p>
          <ConnectWalletContent onConnect={onClose} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Wallet list ───────────────────────────────────────────────────────────────
function ConnectWalletContent({ onConnect }: { onConnect: () => void }) {
  const { wallets = [], notDetectedWallets = [] } = useWallet();
  const { petraWebWallets, availableWallets, installableWallets } = groupAndSortWallets([
    ...wallets,
    ...notDetectedWallets,
  ]);

  return (
    <>
      {/* Keyless sign-in buttons (Google / Apple) */}
      {petraWebWallets.length > 0 && (
        <div className="flex flex-col gap-2">
          {petraWebWallets.map((wallet) => {
            const { icon, label } = providerMeta(wallet.name);
            return (
              <WalletItem key={wallet.name} wallet={wallet} onConnect={onConnect}>
                <WalletItem.ConnectButton asChild>
                  <button
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/20 text-white font-semibold text-base transition-all hover:bg-white/10 active:scale-95"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  >
                    {icon}
                    {label}
                  </button>
                </WalletItem.ConnectButton>
              </WalletItem>
            );
          })}

          <AptosPrivacyPolicy className="flex flex-col items-center py-1">
            <p className="text-xs leading-5 text-white/30 text-center">
              <AptosPrivacyPolicy.Disclaimer />{" "}
              <AptosPrivacyPolicy.Link className="text-white/40 underline underline-offset-4 hover:text-white/60" />
            </p>
            <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-white/30 mt-1" />
          </AptosPrivacyPolicy>

          {(availableWallets.length > 0 || installableWallets.length > 0) && (
            <div className="flex items-center gap-3 text-white/30 text-xs">
              <div className="h-px flex-1 bg-white/10" />
              Or connect a wallet
              <div className="h-px flex-1 bg-white/10" />
            </div>
          )}
        </div>
      )}

      {/* Extension wallets */}
      <div className="flex flex-col gap-2">
        {availableWallets.map((wallet) => (
          <WalletRow key={wallet.name} wallet={wallet} onConnect={onConnect} />
        ))}
      </div>

      {installableWallets.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost" className="w-full gap-2 text-white/50 hover:text-white hover:bg-white/10">
              More wallets <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 pt-2">
            {installableWallets.map((wallet) => (
              <WalletRow key={wallet.name} wallet={wallet} onConnect={onConnect} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  );
}

// ─── Single wallet row ─────────────────────────────────────────────────────────
interface WalletRowProps {
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="flex items-center justify-between px-4 py-3 gap-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <WalletItem.Icon className="h-6 w-6" />
        <WalletItem.Name className="text-sm font-medium text-white" />
      </div>
      {isInstallRequired(wallet) ? (
        <Button size="sm" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10 text-xs" asChild>
          <WalletItem.InstallLink />
        </Button>
      ) : (
        <WalletItem.ConnectButton asChild>
          <Button size="sm" className="text-white hover:brightness-110 border-0 text-xs" style={{ backgroundColor: "#E50914" }}>
            Connect
          </Button>
        </WalletItem.ConnectButton>
      )}
    </WalletItem>
  );
}
