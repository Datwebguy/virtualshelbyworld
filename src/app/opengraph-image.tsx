import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VirtualShelbyWorld - Netflix for Web3";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CARDS = [
  { title: "Big Buck Bunny",    views: "143K", bg: "#1a3a2a" },
  { title: "Elephant's Dream",  views: "98K",  bg: "#1a2a4a" },
  { title: "Tears of Steel",    views: "76K",  bg: "#3a1a2a" },
  { title: "For Bigger Blazes", views: "54K",  bg: "#2a3a1a" },
  { title: "For Bigger Fun",    views: "39K",  bg: "#1a3a3a" },
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "#141414",
          fontFamily: "system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Red top bar */}
        <div style={{ width: 1200, height: 5, background: "#E50914", display: "flex", flexShrink: 0 }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 52px",
            background: "rgba(0,0,0,0.8)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", color: "#E50914", fontSize: 24, fontWeight: 900 }}>
            VirtualShelbyWorld
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 28 }}>
            <div style={{ display: "flex", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Home</div>
            <div style={{ display: "flex", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Browse</div>
            <div style={{ display: "flex", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>My Uploads</div>
          </div>
          <div
            style={{
              display: "flex",
              background: "#E50914",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 18px",
              borderRadius: 7,
            }}
          >
            + Upload
          </div>
        </div>

        {/* Hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 52px 16px",
            background: "linear-gradient(180deg, #1c0000 0%, #141414 100%)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", color: "#E50914", fontSize: 11, fontWeight: 700, letterSpacing: 5, marginBottom: 8 }}>
            WEB3 VIDEO PLATFORM
          </div>
          <div style={{ display: "flex", color: "#ffffff", fontSize: 46, fontWeight: 900, marginBottom: 10 }}>
            Stream. Upload. Earn.
          </div>
          <div
            style={{
              display: "flex",
              color: "rgba(255,255,255,0.45)",
              fontSize: 17,
              textAlign: "center",
              marginBottom: 18,
            }}
          >
            Decentralized video on Shelby Hot Storage and Aptos. Tip creators in APT.
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 14 }}>
            <div
              style={{
                display: "flex",
                background: "#ffffff",
                color: "#000000",
                fontSize: 13,
                fontWeight: 700,
                padding: "9px 22px",
                borderRadius: 7,
              }}
            >
              Start Watching
            </div>
            <div
              style={{
                display: "flex",
                background: "#E50914",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                padding: "9px 22px",
                borderRadius: 7,
              }}
            >
              Upload Your Video
            </div>
          </div>
        </div>

        {/* Trending label */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: "10px 52px 8px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", color: "#ffffff", fontSize: 15, fontWeight: 700 }}>
            Trending on Shelby
          </div>
          <div
            style={{
              display: "flex",
              background: "#E50914",
              color: "#ffffff",
              fontSize: 9,
              fontWeight: 700,
              padding: "3px 7px",
              borderRadius: 4,
            }}
          >
            LIVE
          </div>
        </div>

        {/* Video cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 10,
            padding: "0 52px",
            flexShrink: 0,
          }}
        >
          {CARDS.map((card, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 85,
                  borderRadius: 7,
                  background: `linear-gradient(135deg, ${card.bg} 0%, #0a0a0a 100%)`,
                  border: "1px solid rgba(255,255,255,0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
              </div>
              {/* Title */}
              <div style={{ display: "flex", color: "#ffffff", fontSize: 10, fontWeight: 600 }}>
                {card.title}
              </div>
              {/* Views */}
              <div style={{ display: "flex", color: "rgba(255,255,255,0.35)", fontSize: 9 }}>
                {card.views} views
              </div>
            </div>
          ))}
        </div>

        {/* Bottom red line */}
        <div style={{ display: "flex", marginTop: "auto", width: 1200, height: 4, background: "rgba(229,9,20,0.6)", flexShrink: 0 }} />
      </div>
    ),
    { ...size }
  );
}
