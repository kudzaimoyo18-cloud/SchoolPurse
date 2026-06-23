import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";

/**
 * Subtle animated grid + radial glow used as the base layer for every scene.
 * Keeps a consistent canvas while the scenes change content above it.
 */
export const GridBackground: React.FC<{
  hue?: "navy" | "sky" | "transition";
}> = ({ hue = "navy" }) => {
  const frame = useCurrentFrame();
  // Slow drift on the grid for a sense of motion without distracting.
  const drift = (frame % 80) - 40;

  const glowColor =
    hue === "sky" ? theme.sky : hue === "transition" ? theme.skyDeep : theme.navy;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: 1600,
          height: 1600,
          marginLeft: -800,
          marginTop: -800,
          background: `radial-gradient(circle, ${glowColor}33 0%, ${glowColor}00 60%)`,
          filter: "blur(80px)",
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          backgroundImage: `linear-gradient(to right, ${theme.borderSoft} 1px, transparent 1px), linear-gradient(to bottom, ${theme.borderSoft} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          transform: `translate(${drift}px, ${drift}px)`,
          opacity: 0.5,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, transparent 40%, ${theme.bg}cc 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
