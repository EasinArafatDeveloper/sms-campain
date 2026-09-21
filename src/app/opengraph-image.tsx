import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0b1020 0%, #1e1b4b 55%, #0c4a6e 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "linear-gradient(135deg, #6366f1, #2563eb 55%, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
            }}
          >
            ➤
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>{BRAND.name}</div>
        </div>
        <div style={{ marginTop: 44, fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          Stop guessing who read your SMS
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#cbd5e1", maxWidth: 860 }}>
          A unique short link for every recipient. See who clicked, follow up with who is ready to buy.
        </div>
      </div>
    ),
    size
  );
}
