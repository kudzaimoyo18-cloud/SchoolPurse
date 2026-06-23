import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { DashboardMock } from "../components/DashboardMock";
import { fontFamily, theme } from "../theme";

/**
 * Scene 7 (34-41s, 210 frames local) — Record payments in seconds.
 */
export const SceneFeaturePayments: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(frame, [168, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="navy" />

      {/* Caption top-left */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 120,
          opacity: interpolate(frame, [8, 28], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(frame, [8, 28], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
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
          Feature 01
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 80,
            fontWeight: 800,
            color: theme.white,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            maxWidth: 720,
          }}
        >
          Record cash.
          <br />
          <span
            style={{
              backgroundImage: `linear-gradient(180deg, ${theme.sky} 0%, ${theme.skyDeep} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Print receipt.
          </span>
          <br />
          Done.
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
          Parents pay at the office. The bursar logs it, the receipt prints, the
          ledger updates &mdash; in seconds.
        </div>
      </div>

      {/* Dashboard mock on the right */}
      <AbsoluteFill
        style={{
          alignItems: "flex-end",
          justifyContent: "center",
          paddingRight: 80,
        }}
      >
        <div style={{ transform: "scale(0.78)" }}>
          <DashboardMock variant="payments" delay={20} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
