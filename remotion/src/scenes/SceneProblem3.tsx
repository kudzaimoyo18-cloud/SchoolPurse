import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { AnimatedText } from "../components/AnimatedText";
import { fontFamily, theme } from "../theme";

/**
 * Scene 4 (18-24s, 180 frames local) — Arrears unknown, reports take days.
 * Big number + small loading bar + caption.
 */
export const SceneProblem3: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(frame, [138, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Count up an "unknown" amount that resets/glitches — feels like uncertainty.
  const countTarget = 13360;
  const countProgress = interpolate(frame, [30, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flicker = Math.sin(frame / 3) > 0.7 && frame > 90 && frame < 110;
  const displayed = Math.round(countTarget * countProgress);
  const formatted = `$${displayed.toLocaleString("en-US")}.00`;

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="navy" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 22,
            fontWeight: 600,
            color: theme.red,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            padding: "10px 24px",
            borderRadius: 999,
            background: theme.redSoft,
            border: `1px solid ${theme.red}66`,
            opacity: interpolate(frame, [6, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Outstanding fees
        </div>

        <div
          style={{
            fontFamily,
            fontSize: 240,
            fontWeight: 800,
            color: flicker ? theme.textMuted : theme.red,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            opacity: interpolate(frame, [10, 28], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            textShadow: `0 0 80px ${theme.red}44`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatted}
        </div>

        <div
          style={{
            fontFamily,
            fontSize: 36,
            fontWeight: 600,
            color: theme.textMuted,
            opacity: interpolate(frame, [60, 80], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}>
          ...we think.
        </div>

        <div
          style={{
            marginTop: 32,
            opacity: interpolate(frame, [110, 130], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [110, 130], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
            fontFamily,
            fontSize: 28,
            color: theme.text,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Month-end takes a week.{" "}
          <span style={{ color: theme.textMuted }}>
            The board is still waiting.
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
