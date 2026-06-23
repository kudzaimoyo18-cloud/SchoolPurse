import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { fontFamily, theme } from "../theme";

/**
 * Scene 5 (24-28s, 120 frames local) — Transition. "There has to be a better way."
 * Particles converging gives a sense of order emerging from chaos.
 */
export const SceneTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exitOpacity = interpolate(frame, [78, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 30 particles converging from random angles to center
  const particles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const startRadius = 900;
    const x = Math.cos(angle) * startRadius;
    const y = Math.sin(angle) * startRadius;
    const t = interpolate(frame, [i * 0.6, 60 + i * 0.4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { x: x * (1 - t), y: y * (1 - t), t };
  });

  const textOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(
    spring({ frame: frame - 60, fps, config: { damping: 18 } }),
    [0, 1],
    [20, 0]
  );

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <GridBackground hue="transition" />

      {/* Particles */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 6 + (i % 4) * 2,
              height: 6 + (i % 4) * 2,
              borderRadius: "50%",
              background: i % 2 === 0 ? theme.sky : theme.skyDeep,
              transform: `translate(${p.x}px, ${p.y}px)`,
              boxShadow: `0 0 16px ${theme.sky}80`,
              opacity: p.t,
            }}
          />
        ))}
      </AbsoluteFill>

      {/* Center text */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 96,
            fontWeight: 800,
            color: theme.white,
            letterSpacing: "-0.025em",
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          There&rsquo;s a{" "}
          <span
            style={{
              backgroundImage: `linear-gradient(180deg, ${theme.sky} 0%, ${theme.skyDeep} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            better way.
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
