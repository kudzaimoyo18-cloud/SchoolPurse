import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { AnimatedText } from "../components/AnimatedText";
import { fontFamily, theme } from "../theme";

/**
 * Scene 1 (0-4s) — Hook. Sets the tone: this is about Zimbabwean schools.
 */
export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  // Out-fade for the last 12 frames so the cut to scene 2 doesn't jar.
  const exitOpacity = interpolate(frame, [78, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="navy" />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Small tag at top */}
        <div
          style={{
            opacity: interpolate(frame, [4, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [4, 18], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
            fontFamily,
            fontSize: 16,
            fontWeight: 600,
            color: theme.sky,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(56, 189, 248, 0.10)",
            border: `1px solid ${theme.sky}40`,
          }}
        >
          A short story
        </div>

        <AnimatedText
          text="Running a school"
          delay={12}
          size={120}
          weight={800}
          variant="split"
          maxWidth={1500}
        />
        <AnimatedText
          text="takes work."
          delay={32}
          size={120}
          weight={800}
          variant="split"
          gradient
          maxWidth={1500}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
