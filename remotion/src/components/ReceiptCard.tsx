import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { fontFamily, theme } from "../theme";

/**
 * A clean SchoolPurse receipt, sliding in from below. Used in the
 * "receipts print themselves" feature scene.
 */
export const ReceiptCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delay;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 18, mass: 0.7 },
  });
  const opacity = interpolate(local, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const y = interpolate(enter, [0, 1], [80, 0]);
  const rot = interpolate(enter, [0, 1], [4, 0]);

  return (
    <div
      style={{
        width: 520,
        background: "#ffffff",
        borderRadius: 16,
        padding: 36,
        fontFamily,
        color: "#0f172a",
        opacity,
        transform: `translateY(${y}px) rotate(${rot}deg)`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${theme.sky}33`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: theme.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.sky}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="6" rx="2" />
            <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <path d="M2 13h20" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Krypton Academy
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Official receipt
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "#e2e8f0", margin: "24px 0" }} />

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
            Receipt
          </div>
          <div style={{ fontSize: 14, fontFamily: "monospace", marginTop: 4 }}>
            KA-2026-000001
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
            Date
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>22 May 2026</div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
            Student
          </div>
          <div style={{ fontSize: 14, marginTop: 4, fontWeight: 600 }}>
            Zara Khumalo
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Grade 1</div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
            Method
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Cash</div>
        </div>
      </div>

      <div style={{ height: 1, background: "#e2e8f0", margin: "24px 0" }} />

      {/* Line items */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            fontSize: 13,
          }}
        >
          <span>Term 1 Tuition</span>
          <span style={{ fontWeight: 600 }}>$150.00</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            fontSize: 13,
          }}
        >
          <span>Sports Levy</span>
          <span style={{ fontWeight: 600 }}>$50.00</span>
        </div>
      </div>

      <div style={{ height: 1, background: "#e2e8f0", margin: "20px 0" }} />

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Amount paid
        </span>
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: theme.navy,
          }}
        >
          $200.00
        </span>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "10px 14px",
          background: theme.greenSoft,
          color: theme.green,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        ✓ Payment recorded
      </div>
    </div>
  );
};
