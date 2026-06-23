import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { ReceiptCard } from "../components/ReceiptCard";
import { fontFamily, theme } from "../theme";

/**
 * Scene 9 (48-54s, 180 frames local) — Receipts on demand.
 */
export const SceneFeatureReceipts: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(frame, [138, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="navy" />
      <AbsoluteFill
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
        }}
      >
        {/* Text left */}
        <div
          style={{
            paddingLeft: 120,
            opacity: interpolate(frame, [8, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [8, 30], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 16,
              fontWeight: 600,
              color: theme.sky,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Feature 03
          </div>
          <div
            style={{
              fontFamily,
              fontSize: 88,
              fontWeight: 800,
              color: theme.white,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            Receipts that
            <br />
            <span
              style={{
                backgroundImage: `linear-gradient(180deg, ${theme.sky} 0%, ${theme.skyDeep} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              print themselves.
            </span>
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily,
              fontSize: 22,
              color: theme.textMuted,
              fontWeight: 500,
              maxWidth: 540,
              lineHeight: 1.5,
            }}
          >
            School header, receipt number, line items, signature line.
            Every payment is a printable receipt &mdash; on demand.
          </div>
        </div>

        {/* Receipt right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 80,
          }}
        >
          <ReceiptCard delay={20} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
