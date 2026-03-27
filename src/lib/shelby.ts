/**
 * Shelby Hot Storage client
 * Fetches video metadata from the Shelby RPC Gateway on Aptos Testnet.
 *
 * When @shelby-protocol/sdk is published, replace the fetch calls below
 * with: import { ShelbyClient } from "@shelby-protocol/sdk"
 */

export const SHELBY_RPC = "https://rpc.testnet.shelby.xyz";

export interface ShelbyVideo {
  cid: string;
  title: string;
  description: string;
  creator: string;       // Aptos wallet address
  creatorName: string;
  thumbnailUrl: string;
  streamUrl: string;
  views: number;
  duration: string;      // "mm:ss"
  uploadedAt: string;
}

/**
 * Fetches trending videos from the Shelby RPC Gateway.
 * Falls back to curated mock data if the network is unavailable.
 */
export async function fetchTrendingVideos(): Promise<ShelbyVideo[]> {
  try {
    const res = await fetch(`${SHELBY_RPC}/v1/trending?limit=8&network=testnet`);
    if (!res.ok) throw new Error(`Shelby RPC ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data?.videos) || data.videos.length === 0) {
      throw new Error("Empty response");
    }
    return data.videos as ShelbyVideo[];
  } catch {
    // RPC not reachable — return curated mock data with real Shelby structure
    return MOCK_TRENDING;
  }
}

/** Resolve a Shelby CID to a streamable URL */
export function shelbyStreamUrl(cid: string): string {
  return `${SHELBY_RPC}/stream/${cid}`;
}

// ---------------------------------------------------------------------------
// Public demo stream URLs (used while Shelby Testnet RPC is offline)
// Source: Google TV sample videos (open / public domain)
// ---------------------------------------------------------------------------
const DEMO_BASE = "https://storage.googleapis.com/gtv-videos-bucket/sample";

// ---------------------------------------------------------------------------
// Mock data — each entry's title, description, thumbnail & creator accurately
// describe the actual demo video file being streamed.
// ---------------------------------------------------------------------------
const MOCK_TRENDING: ShelbyVideo[] = [
  {
    // BigBuckBunny.mp4 — Blender Foundation animated comedy short
    cid: "bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu",
    title: "Big Buck Bunny",
    description:
      "A large, gentle rabbit is pestered by three small woodland creatures — until he decides enough is enough. A Blender Foundation open-source animated comedy.",
    creator: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    creatorName: "Blender Foundation",
    thumbnailUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&q=70",
    streamUrl: `${DEMO_BASE}/BigBuckBunny.mp4`,
    views: 142800,
    duration: "9:56",
    uploadedAt: "2026-03-20",
  },
  {
    // ElephantsDream.mp4 — Blender Foundation animated sci-fi short
    cid: "bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq",
    title: "Elephant's Dream",
    description:
      "Two characters journey through a surreal mechanical world full of bizarre contraptions. The first open movie ever produced by the Blender Foundation.",
    creator: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    creatorName: "Blender Foundation",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=70",
    streamUrl: `${DEMO_BASE}/ElephantsDream.mp4`,
    views: 98400,
    duration: "10:54",
    uploadedAt: "2026-03-21",
  },
  {
    // TearsOfSteel.mp4 — Blender Foundation live-action + CG sci-fi short
    cid: "bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354",
    title: "Tears of Steel",
    description:
      "A group of warriors and scientists sacrifice their most important memories to reclaim the world from a powerful robot army. Live-action meets stunning CG visuals.",
    creator: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    creatorName: "Blender Foundation",
    thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=70",
    streamUrl: `${DEMO_BASE}/TearsOfSteel.mp4`,
    views: 76200,
    duration: "12:14",
    uploadedAt: "2026-03-19",
  },
  {
    // ForBiggerBlazes.mp4 — high-intensity action/fire demo reel
    cid: "bafybeihkoipbqzgdg64wngx5a64kxymkbf4zxywklxoijkzmhf3in7iq3u",
    title: "For Bigger Blazes",
    description:
      "An explosive 15-second action reel showcasing dramatic fire and high-energy stunts. Buckle up.",
    creator: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    creatorName: "Google Samples",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70",
    streamUrl: `${DEMO_BASE}/ForBiggerBlazes.mp4`,
    views: 54100,
    duration: "0:15",
    uploadedAt: "2026-03-22",
  },
  {
    // ForBiggerEscapes.mp4 — adventure/nature escape demo reel
    cid: "bafybeihdwdcefgh4c32nvh3jzmovyl672gs6gi7owvkokbu326dkqlxsrq",
    title: "For Bigger Escapes",
    description:
      "Breathtaking outdoor scenery and adventure footage packed into 15 seconds. Wide open spaces, wide open possibilities.",
    creator: "0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    creatorName: "Google Samples",
    thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70",
    streamUrl: `${DEMO_BASE}/ForBiggerEscapes.mp4`,
    views: 38700,
    duration: "0:15",
    uploadedAt: "2026-03-18",
  },
  {
    // ForBiggerFun.mp4 — entertainment & energy demo reel
    cid: "bafybeigdyrzt55bfrp6vxbxvdq4yfhqlnbstsftbrq4d6g2eovnp7ewrsi",
    title: "For Bigger Fun",
    description:
      "Lights, energy, and pure entertainment in a 15-second burst. A feel-good showcase of what great video looks like.",
    creator: "0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
    creatorName: "Google Samples",
    thumbnailUrl: "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?w=400&q=70",
    streamUrl: `${DEMO_BASE}/ForBiggerFun.mp4`,
    views: 29300,
    duration: "0:15",
    uploadedAt: "2026-03-17",
  },
  {
    // SubaruOutbackOnStreetAndDirt.mp4 — Subaru Outback car commercial
    cid: "bafybeie5gq4jxvzalzoarze5hnswt4vbsgxsedkjt3ijxjepjjrb7txqni",
    title: "Subaru Outback: Street & Dirt",
    description:
      "The Subaru Outback tackled both smooth tarmac and rugged off-road trails in this cinematic automotive showcase. Adventure starts here.",
    creator: "0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8",
    creatorName: "Subaru Official",
    thumbnailUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=70",
    streamUrl: `${DEMO_BASE}/SubaruOutbackOnStreetAndDirt.mp4`,
    views: 21500,
    duration: "5:25",
    uploadedAt: "2026-03-15",
  },
  {
    // VolkswagenGTIReview.mp4 — Volkswagen GTI in-depth review
    cid: "bafybeifx7yeb55hqszcygkmo5xtls3zfnslhyxwzsdlyxlklzqr33m3giy",
    title: "Volkswagen GTI Review",
    description:
      "A deep-dive review of the iconic Volkswagen GTI — performance, handling, and interior examined. The hot hatch benchmark tested.",
    creator: "0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9",
    creatorName: "Auto Showcase",
    thumbnailUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=70",
    streamUrl: `${DEMO_BASE}/VolkswagenGTIReview.mp4`,
    views: 18900,
    duration: "5:04",
    uploadedAt: "2026-03-14",
  },
];

// ---------------------------------------------------------------------------
// Browse categories — used by BrowseSection
// ---------------------------------------------------------------------------
export interface BrowseCategory {
  id: string;
  label: string;
  videos: ShelbyVideo[];
}

export function fetchBrowseCategories(): BrowseCategory[] {
  return [
    {
      id: "blender-open-movies",
      label: "Blender Open Movies",
      videos: [
        MOCK_TRENDING[0], // Big Buck Bunny
        MOCK_TRENDING[1], // Elephant's Dream
        MOCK_TRENDING[2], // Tears of Steel
      ],
    },
    {
      id: "action-adventure",
      label: "Action & Adventure",
      videos: [
        MOCK_TRENDING[3], // For Bigger Blazes
        MOCK_TRENDING[4], // For Bigger Escapes
        MOCK_TRENDING[5], // For Bigger Fun
        MOCK_TRENDING[2], // Tears of Steel
      ],
    },
    {
      id: "automotive",
      label: "Automotive Showcase",
      videos: [
        MOCK_TRENDING[6], // Subaru Outback
        MOCK_TRENDING[7], // Volkswagen GTI
        MOCK_TRENDING[4], // For Bigger Escapes (outdoor/adventure driving vibe)
      ],
    },
  ];
}
