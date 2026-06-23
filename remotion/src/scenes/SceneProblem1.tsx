import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { AnimatedText } from "../components/AnimatedText";
import { fontFamily, theme } from "../theme";

/**
 * Scene 2 (4-11s, 210 frames local) — Tracking the money is harder.
 */
export const SceneProblem1: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(frame, [168, 180], [1, 0], {
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
          gap: 40,
        }}
      >
        <AnimatedText
          text="Tracking the money?"
          delay={8}
          size={104}
          weight={700}
          variant="fade-up"
        />
        <AnimatedText
          text="Even harder."
          delay={36}
          size={140}
          weight={800}
          variant="fade-up"
          gradient
        />

        {/* List of pain points appearing */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
            opacity: interpolate(frame, [80, 110], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {["Cash in hand", "Paper receipts", "Books & lists", "Spreadsheets"].map(
            (label, i) => (
              <div
                key={label}
                style={{
                  fontFamily,
                  fontSize: 22,
                  color: theme.textMuted,
                  padding: "14px 26px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${theme.borderSoft}`,
                  opacity: interpolate(frame, [80 + i * 6, 100 + i * 6], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  transform: `translateY(${interpolate(
                    frame,
                    [80 + i * 6, 100 + i * 6],
                    [12, 0],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                  )}px)`,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
