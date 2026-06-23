import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { Logo } from "../components/Logo";
import { fontFamily, theme } from "../theme";

/**
 * Scene 6 (28-34s, 180 frames local) — SchoolPurse logo reveal.
 */
export const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(frame, [138, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="sky" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 48,
        }}
      >
        <Logo delay={10} scale={1.4} />
        <div
          style={{
            fontFamily,
            fontSize: 32,
            fontWeight: 500,
            color: theme.textMuted,
            letterSpacing: "-0.01em",
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.3,
            opacity: interpolate(frame, [60, 90], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [60, 90], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          }}
        >
          The finance dashboard built for{" "}
          <span style={{ color: theme.white, fontWeight: 600 }}>
            Zimbabwean schools.
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
