import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { Logo } from "../components/Logo";
import { fontFamily, theme } from "../theme";

/**
 * Scene 10 (54-60s, 180 frames local) — Closing CTA. Logo + tagline + URL.
 */
export const SceneClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const urlOpacity = interpolate(frame, [50, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 16, mass: 0.6 },
  });

  // Final fade-out for last 12 frames so the video doesn't end on a hard cut
  const finalFade = interpolate(frame, [138, 150], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: finalFade }}>
      <GridBackground hue="sky" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 56,
        }}
      >
        {/* Zim flag badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${theme.borderSoft}`,
            borderRadius: 999,
            fontFamily,
            fontSize: 18,
            fontWeight: 600,
            color: theme.textMuted,
            opacity: interpolate(frame, [4, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              width: 24,
              height: 16,
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: `1px solid rgba(255,255,255,0.2)`,
            }}
          >
            {/* Simplified Zimbabwe flag stripes */}
            <div style={{ flex: 1, background: "#078930" }} />
            <div style={{ flex: 1, background: "#fce100" }} />
            <div style={{ flex: 1, background: "#ce1126" }} />
            <div style={{ flex: 1, background: "#000000" }} />
            <div style={{ flex: 1, background: "#ce1126" }} />
            <div style={{ flex: 1, background: "#fce100" }} />
            <div style={{ flex: 1, background: "#078930" }} />
          </div>
          Built in Harare, for Zimbabwean schools
        </div>

        <Logo delay={14} scale={1.6} />

        {/* URL CTA */}
        <div
          style={{
            opacity: urlOpacity,
            transform: `scale(${interpolate(urlScale, [0, 1], [0.85, 1])})`,
            padding: "20px 56px",
            borderRadius: 999,
            background: `linear-gradient(180deg, ${theme.navy} 0%, ${theme.navyDeep} 100%)`,
            border: `1px solid rgba(255,255,255,0.14)`,
            boxShadow: `0 30px 80px ${theme.sky}33, inset 0 1px 0 rgba(255,255,255,0.18)`,
            fontFamily,
            fontSize: 36,
            fontWeight: 700,
            color: theme.white,
            letterSpacing: "-0.01em",
          }}
        >
          schoolpurse.app
        </div>

        <div
          style={{
            fontFamily,
            fontSize: 18,
            color: theme.textDim,
            fontWeight: 500,
            opacity: interpolate(frame, [80, 100], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Multi-tenant &middot; Audit-logged &middot; Made with care
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
