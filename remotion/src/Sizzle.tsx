import {
  AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import React from "react";

const { fontFamily } = loadFont();

const NAVY = "#0b1f2e";
const GREEN = "#22c27a";
const GREEN_D = "#1aa869";
const WHITE = "#f4f8fb";
const SUB = "#8aa4be";
const RULE = "#1c3346";

// ---- Brand mark: green briefcase + white coin ($) ----
const Mark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M24 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3" stroke={GREEN} strokeWidth={3.2} strokeLinecap="round" />
    <rect x="9" y="21" width="46" height="32" rx="8" fill={GREEN} />
    <rect x="9" y="34" width="46" height="6" fill={GREEN_D} opacity={0.55} />
    <circle cx="32" cy="37" r="9" fill="#fff" />
    <path d="M32 31.5v11M34.5 33.5c-.7-1-1.7-1.4-2.9-1.4-1.7 0-3 .9-3 2.4 0 3.2 6.2 1.7 6.2 4.9 0 1.6-1.4 2.6-3.3 2.6-1.4 0-2.5-.5-3.2-1.6"
      stroke={NAVY} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Tick: React.FC<{ size: number; delay: number }> = ({ size, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 13, mass: 0.5 } });
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "rgba(34,194,122,.16)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: `scale(${interpolate(s, [0, 1], [0.2, 1])})`,
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M5 12.5l4.5 4.5L19 7" stroke={GREEN} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={30} strokeDashoffset={interpolate(s, [0, 1], [30, 0])} />
      </svg>
    </div>
  );
};

// Persistent ledger background
const Bg: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame % 90) - 45;
  return (
    <AbsoluteFill style={{ background: NAVY, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: -50, opacity: 0.05,
        backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
        backgroundSize: "96px 96px", transform: `translate(${drift}px, ${drift}px)`,
      }} />
      <div style={{
        position: "absolute", top: "32%", left: "50%", width: 1300, height: 1300,
        marginLeft: -650, marginTop: -650, filter: "blur(90px)",
        background: `radial-gradient(circle, ${GREEN}22 0%, ${GREEN}00 60%)`,
        opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" }),
      }} />
      {/* left rule */}
      <div style={{ position: "absolute", left: 110, top: 150, bottom: 150, width: 3, background: GREEN, opacity: 0.18 }} />
    </AbsoluteFill>
  );
};

const Stack: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 110px", ...style }}>
    {children}
  </AbsoluteFill>
);

// Phase A: logo build
const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const wordO = interpolate(frame, [16, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subO = interpolate(frame, [30, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stack style={{ opacity: out }}>
      <div style={{ transform: `scale(${interpolate(enter, [0, 1], [0.55, 1])})`, opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }) }}>
        <Mark size={210} />
      </div>
      <div style={{
        fontFamily, fontWeight: 700, fontSize: 104, letterSpacing: "-0.03em", color: WHITE,
        marginTop: 52, opacity: wordO, transform: `translateY(${interpolate(wordO, [0, 1], [18, 0])}px)`,
      }}>
        School<span style={{ color: GREEN }}>Purse</span>
      </div>
      <div style={{
        fontFamily, fontWeight: 600, fontSize: 27, letterSpacing: "0.16em", textTransform: "uppercase",
        color: SUB, marginTop: 22, opacity: subO,
      }}>
        Fee tracking for Zimbabwean schools
      </div>
    </Stack>
  );
};

const lines = ["Track every fee.", "Issue every receipt.", "See every report."];

// Phase B: three ledger lines
const SceneLines: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [196, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 150px", opacity: out }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
        {lines.map((t, i) => {
          const d = 10 + i * 30;
          const o = interpolate(frame, [d, d + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [d, d + 20], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 34, opacity: o, transform: `translateX(${x}px)` }}>
              <Tick size={74} delay={d + 4} />
              <div style={{ fontFamily, fontWeight: 700, fontSize: 76, letterSpacing: "-0.025em", color: WHITE }}>{t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Phase C: CTA
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 15, mass: 0.7 } });
  const o = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Stack style={{ opacity: o }}>
      <div style={{ transform: `scale(${interpolate(e, [0, 1], [0.6, 1])})` }}><Mark size={150} /></div>
      <div style={{ fontFamily, fontWeight: 700, fontSize: 84, letterSpacing: "-0.03em", color: WHITE, marginTop: 44 }}>
        School<span style={{ color: GREEN }}>Purse</span>
      </div>
      <div style={{
        marginTop: 50, background: GREEN, color: "#05221a", fontFamily, fontWeight: 700, fontSize: 40,
        padding: "26px 46px", borderRadius: 999, letterSpacing: "-0.01em",
        transform: `translateY(${interpolate(frame, [10, 28], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
        opacity: interpolate(frame, [10, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Sign in — link in bio  →
      </div>
      <div style={{ fontFamily, fontWeight: 600, fontSize: 34, color: GREEN, marginTop: 40,
        opacity: interpolate(frame, [22, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        @SchoolPursezw
      </div>
    </Stack>
  );
};

// small persistent seal (top) after intro
const Seal: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [92, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o2 = interpolate(frame, [300, 312], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center",
      alignItems: "center", gap: 16, opacity: Math.min(o, o2) }}>
      <Mark size={52} />
      <div style={{ fontFamily, fontWeight: 700, fontSize: 40, letterSpacing: "-0.02em", color: WHITE }}>
        School<span style={{ color: GREEN }}>Purse</span>
      </div>
    </div>
  );
};

export const Sizzle: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <Bg />
      <Seal />
      <Sequence durationInFrames={90}><SceneLogo /></Sequence>
      <Sequence from={90} durationInFrames={210}><SceneLines /></Sequence>
      <Sequence from={300} durationInFrames={90}><SceneCTA /></Sequence>
    </AbsoluteFill>
  );
};
