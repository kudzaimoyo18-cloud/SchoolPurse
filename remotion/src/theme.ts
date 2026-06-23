/**
 * SchoolPurse brand tokens lifted from globals.css so the video stays
 * visually consistent with the live product.
 */
export const theme = {
  bg: "#0b1221",           // dark background
  bgAlt: "#111c2e",        // card bg
  navy: "#1e3a5f",         // primary
  navyDeep: "#0c1929",     // sidebar
  sky: "#38bdf8",          // primary in dark / accent
  skyDeep: "#0ea5e9",      // accent
  text: "#e2e8f0",         // foreground
  textMuted: "#94a3b8",
  textDim: "#64748b",
  border: "#1e293b",
  borderSoft: "rgba(255,255,255,0.07)",
  red: "#ef4444",
  redSoft: "rgba(239, 68, 68, 0.12)",
  green: "#16a34a",
  greenSoft: "rgba(22, 163, 74, 0.15)",
  amber: "#f59e0b",
  amberSoft: "rgba(245, 158, 11, 0.15)",
  white: "#ffffff",
} as const;

export const fontFamily = `'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
