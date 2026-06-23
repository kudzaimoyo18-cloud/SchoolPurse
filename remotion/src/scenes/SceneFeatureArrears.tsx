import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { DashboardMock } from "../components/DashboardMock";
import { fontFamily, theme } from "../theme";

/**
 * Scene 8 (41-48s, 210 frames local) — Arrears at a glance.
 */
export const SceneFeatureArrears: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(frame, [168, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="navy" />

      {/* Dashboard mock on the left */}
      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: 80,
        }}
      >
        <div style={{ transform: "scale(0.78)" }}>
          <DashboardMock variant="arrears" delay={10} />
        </div>
      </AbsoluteFill>

      {/* Caption right */}
      <div
        style={{
          position: "absolute",
          top: 120,
          right: 120,
          opacity: interpolate(frame, [16, 36], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(frame, [16, 36], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
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
          Feature 02
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 80,
            fontWeight: 800,
            color: theme.white,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            maxWidth: 700,
            textAlign: "right",
          }}
        >
          Every arrear.
          <br />
          <span
            style={{
              backgroundImage: `linear-gradient(180deg, ${theme.sky} 0%, ${theme.skyDeep} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            In one place.
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
            textAlign: "right",
            marginLeft: "auto",
          }}
        >
          Outstanding balances by student, by class, by term. Spot who to chase
          today &mdash; not at month-end.
        </div>
      </div>
    </AbsoluteFill>
  );
};
