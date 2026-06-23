import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { fontFamily, theme } from "../theme";

/**
 * SchoolPurse wordmark + briefcase icon, scale-in animated.
 */
export const Logo: React.FC<{ delay?: number; scale?: number }> = ({
  delay = 0,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delay;
  const enter = spring({
    frame: local,
    fps,
    config: { damping: 14, mass: 0.6 },
  });
  const opacity = interpolate(local, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24 * scale,
        transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
        opacity,
      }}
    >
      {/* Briefcase tile */}
      <div
        style={{
          width: 110 * scale,
          height: 110 * scale,
          borderRadius: 26 * scale,
          background: `linear-gradient(180deg, ${theme.navy} 0%, ${theme.navyDeep} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 24px 60px ${theme.sky}40, inset 0 1px 0 rgba(255,255,255,0.14)`,
          border: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        {/* Briefcase SVG matching lucide stroke style */}
        <svg
          width={56 * scale}
          height={56 * scale}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.sky}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="14" x="2" y="6" rx="2" />
          <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <path d="M2 13h20" />
        </svg>
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          letterSpacing: "-0.025em",
        }}
      >
        <div
          style={{
            fontSize: 96 * scale,
            lineHeight: 1,
            color: theme.white,
          }}
        >
          School
          <span style={{ color: theme.sky }}>Purse</span>
        </div>
        <div
          style={{
            marginTop: 8 * scale,
            fontSize: 18 * scale,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: theme.textMuted,
          }}
        >
          Finance Tracker
        </div>
      </div>
    </div>
  );
};
