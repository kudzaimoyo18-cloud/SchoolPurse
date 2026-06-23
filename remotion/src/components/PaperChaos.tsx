import { useCurrentFrame, interpolate, spring, useVideoConfig, random } from "remotion";
import { fontFamily, theme } from "../theme";

/**
 * Scattered cream-colored "paper" cards floating in slowly to convey the
 * chaos of manual bookkeeping. Used in the problem scenes.
 */
interface Paper {
  text: string;
  amount?: string;
  x: number;
  y: number;
  rotate: number;
  scribble?: boolean;
}

const PAPERS: Paper[] = [
  { text: "Mrs Moyo paid?", amount: "$45 ??", x: -480, y: -180, rotate: -8 },
  { text: "Term 1 Fees", amount: "$200", x: 280, y: -260, rotate: 6 },
  { text: "Grade 3 Sports", amount: "$50", x: -240, y: 120, rotate: 4, scribble: true },
  { text: "Tuition - Banda", amount: "$120", x: 380, y: 60, rotate: -5 },
  { text: "Registration", amount: "$30", x: -460, y: 220, rotate: 12 },
  { text: "Levy?? overdue", amount: "??", x: 200, y: 280, rotate: -10, scribble: true },
  { text: "Cash received", amount: "$80", x: 0, y: -340, rotate: 3 },
  { text: "Boarding - May", amount: "$300", x: -120, y: 360, rotate: 7 },
];

export const PaperChaos: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {PAPERS.map((p, i) => {
        const itemDelay = delay + i * 4;
        const local = frame - itemDelay;
        const enter = spring({
          frame: local,
          fps,
          config: { damping: 22, mass: 1 },
        });
        const opacity = interpolate(local, [0, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Subtle continuous float
        const wobble = Math.sin((frame + i * 30) / 50) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y + wobble}px)`,
              transform: `translate(-50%, -50%) rotate(${p.rotate}deg) scale(${interpolate(enter, [0, 1], [0.5, 1])})`,
              opacity,
              width: 220,
              padding: "18px 22px",
              background: p.scribble ? "#fefce8" : "#fffbeb",
              border: `1px solid ${p.scribble ? "#fde047" : "#fcd34d"}`,
              borderRadius: 4,
              boxShadow: `0 16px 30px rgba(0,0,0,0.35), 0 4px 8px rgba(0,0,0,0.2)`,
              fontFamily,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#78350f",
                fontWeight: 500,
                fontStyle: p.scribble ? "italic" : "normal",
                textDecoration: p.scribble ? "line-through" : "none",
              }}
            >
              {p.text}
            </div>
            {p.amount ? (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 18,
                  fontWeight: 700,
                  color: p.scribble ? "#b91c1c" : "#92400e",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {p.amount}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
