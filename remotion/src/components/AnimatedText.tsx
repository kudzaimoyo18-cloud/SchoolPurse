import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { fontFamily, theme } from "../theme";
import React from "react";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  size?: number;
  weight?: number;
  color?: string;
  letterSpacing?: number;
  gradient?: boolean;
  /** Anim style: "fade-up" slides up + fades. "split" reveals word-by-word. */
  variant?: "fade-up" | "split";
  /** Optional max width so long lines wrap nicely on 1920 canvas. */
  maxWidth?: number;
}

/**
 * Headline-style animated text. The two variants cover most marketing needs:
 *   - fade-up: classic — opacity 0→1, translateY 20→0 with a spring
 *   - split:   word-by-word reveal so the eye lands on each word in turn
 */
export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  size = 88,
  weight = 700,
  color = theme.text,
  letterSpacing = -0.03,
  gradient = false,
  variant = "fade-up",
  maxWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const baseStyle: React.CSSProperties = {
    fontFamily,
    fontSize: size,
    fontWeight: weight,
    color,
    letterSpacing: `${letterSpacing}em`,
    lineHeight: 1.05,
    margin: 0,
    textAlign: "center",
    maxWidth,
    ...(gradient
      ? {
          backgroundImage: `linear-gradient(180deg, ${theme.text} 0%, ${theme.sky} 120%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }
      : {}),
  };

  if (variant === "split") {
    const words = text.split(" ");
    return (
      <h1 style={baseStyle}>
        {words.map((w, i) => {
          const wordDelay = delay + i * 4;
          const local = frame - wordDelay;
          const opacity = interpolate(local, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const y = interpolate(local, [0, 12], [16, 0], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity,
                transform: `translateY(${y}px)`,
                marginRight: i < words.length - 1 ? "0.28em" : 0,
              }}
            >
              {w}
            </span>
          );
        })}
      </h1>
    );
  }

  // fade-up
  const local = frame - delay;
  const opacity = interpolate(local, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const progress = spring({
    frame: local,
    fps,
    config: { damping: 18, mass: 0.7 },
  });
  const y = interpolate(progress, [0, 1], [30, 0]);
  return (
    <h1 style={{ ...baseStyle, opacity, transform: `translateY(${y}px)` }}>
      {text}
    </h1>
  );
};
