import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from "@/components/ui/toaster";
import { WrongNetworkAlert } from "@/components/WrongNetworkAlert";

import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141414",
};

export const metadata: Metadata = {
  applicationName: "VirtualShelbyWorld",
  title: "VirtualShelbyWorld — Netflix for Web3",
  description: "Stream, upload and tip creators on the world's first decentralized video platform built on Shelby Hot Storage and Aptos.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "VirtualShelbyWorld",
    title: "VirtualShelbyWorld — Netflix for Web3",
    description: "Stream, upload and tip creators on the world's first decentralized video platform built on Shelby Hot Storage and Aptos.",
    url: "https://virtualshelbyworld.vercel.app",
    images: [
      {
        url: "https://virtualshelbyworld.vercel.app/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VirtualShelbyWorld — Netflix for Web3",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VirtualShelbyWorld — Netflix for Web3",
    description: "Stream, upload and tip creators on the world's first decentralized video platform built on Shelby Hot Storage and Aptos.",
    images: ["https://virtualshelbyworld.vercel.app/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <WalletProvider>
          <ReactQueryProvider>
            <div id="root">{children}</div>
            <WrongNetworkAlert />
            <Toaster />
          </ReactQueryProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
