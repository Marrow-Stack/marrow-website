import { ImageResponse } from "@vercel/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title       = searchParams.get("title")       ?? "MarrowStack"
  const description = searchParams.get("description") ?? "Production TypeScript blocks for Next.js"
  const price       = searchParams.get("price")       ?? ""
  const category    = searchParams.get("category")    ?? ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(145deg, #0f1117 0%, #1a1d27 50%, #0a0c12 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: Brand + category */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#e2e8f0", fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>
            MarrowStack
          </span>
          {category && (
            <span
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                border: "1px solid #334155",
                padding: "6px 14px",
                borderRadius: "999px",
              }}
            >
              {category}
            </span>
          )}
        </div>

        {/* Middle: Title + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: title.length > 30 ? "56px" : "72px",
              fontWeight: 900,
              color: "#f8fafc",
              lineHeight: 1.05,
              letterSpacing: "-2px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            {description.length > 120 ? description.slice(0, 120) + "…" : description}
          </div>
        </div>

        {/* Bottom: Price + tagline */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#64748b", fontSize: "16px" }}>
            marrowstack.dev
          </span>
          {price && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ color: "#f8fafc", fontSize: "48px", fontWeight: 900 }}>
                ${price}
              </span>
              <span style={{ color: "#64748b", fontSize: "16px" }}>
                one-time
              </span>
            </div>
          )}
        </div>

        {/* Decorative metallic line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent 0%, #475569 30%, #94a3b8 50%, #475569 70%, transparent 100%)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
