# virtualshelbyworld Project Rules

## Project Overview
A high-performance decentralized video platform ('Netflix for Web3') built on Shelby Hot Storage and Aptos Devnet.

## Cinematic Design System (Netflix Style)
- **Primary Color:** `#E50914` (Netflix Red) for buttons and accents.
- **Backgrounds:** Gradient from `#141414` (Main) to `#000000` (Deep Black).
- **Surfaces:** Use 'Glassmorphism' for cards: `bg-white/5 backdrop-blur-md border border-white/10`.
- **Animations:** Smooth 'scale-up' hovers (1.05x) and Framer Motion fade-ins for thumbnails.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion.
- **Storage:** `@shelby-protocol/sdk` (Hot Storage Protocol).
- **Blockchain:** `@aptos-labs/ts-sdk` (Aptos Devnet).
- **Auth:** Aptos Keyless (Google Login) — Strictly NO NFT gating.

## Technical Constraints (Shelby Architecture)
- **Hot Reads:** Optimize for sub-second playback. Fetch media from the Shelby RPC Gateway.
- **Erasure Coding:** Use Shelby's default Clay (10+6) encoding for uploads.
- **Identity:** Map Google accounts to Devnet wallet addresses via Aptos Keyless.

## Development Commands
- **Setup:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
