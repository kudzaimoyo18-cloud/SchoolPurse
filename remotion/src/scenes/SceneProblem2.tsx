import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { PaperChaos } from "../components/PaperChaos";
import { AnimatedText } from "../components/AnimatedText";
import { fontFamily, theme } from "../theme";

/**
 * Scene 3 (11-18s, 210 frames local) — The chaos of cash + paper.
 * Scattered scribbled notes float in.
 */
export const SceneProblem2: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(frame, [168, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="navy" />
      <PaperChaos delay={6} />

      {/* Caption at the bottom */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 120,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 18,
            fontWeight: 600,
            color: theme.sky,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(56, 189, 248, 0.10)",
            border: `1px solid ${theme.sky}40`,
            opacity: interpolate(frame, [110, 130], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            marginBottom: 24,
          }}
        >
          Term 1, week 8
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 64,
            fontWeight: 700,
            color: theme.white,
            letterSpacing: "-0.025em",
            textAlign: "center",
            opacity: interpolate(frame, [120, 140], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [120, 140], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          }}
        >
          Who paid? Who owes?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
