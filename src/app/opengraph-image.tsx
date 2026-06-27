import { ImageResponse } from "next/og";

// Branded social-share card, generated at request time (no static asset needed).
// Next attaches this to both og:image and twitter:image for every route that
// doesn't define its own. Satori (the renderer) only supports inline styles and
// requires display:flex on any element with more than one child.
export const alt = "SchoolPurse — School fee management for African schools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#102a43",
          padding: 80,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
          <span>School</span>
          <span style={{ color: "#34d399" }}>Purse</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 960,
            }}
          >
            School fee management, from $35/month
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#94a8bc", marginTop: 24, maxWidth: 880 }}>
            Invoices, receipts, arrears &amp; reports — built for schools in Zimbabwe.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 26, color: "#cbd5e1" }}>schoolpurse.app</div>
          <div style={{ display: "flex", fontSize: 22, color: "#94a8bc" }}>
            Empower · Educate · Elevate
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
