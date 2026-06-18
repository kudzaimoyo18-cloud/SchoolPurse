// ZIMSEC-style grading for the E-Report Book: a percentage maps to a letter
// symbol (A–U) plus a remark. Bands live in one place so adjusting a school's
// standard is a single edit. Pure + framework-free for easy testing.

export type ZimsecSymbol = "A" | "B" | "C" | "D" | "E" | "U";

export interface ZimsecGrade {
  symbol: ZimsecSymbol;
  remark: string;
  /** A–D (>= 50%) count as a pass on this internal scale. */
  pass: boolean;
}

export function zimsecGrade(percent: number): ZimsecGrade {
  const p = Math.max(0, Math.min(100, percent));
  if (p >= 80) return { symbol: "A", remark: "Distinction", pass: true };
  if (p >= 70) return { symbol: "B", remark: "Merit", pass: true };
  if (p >= 60) return { symbol: "C", remark: "Credit", pass: true };
  if (p >= 50) return { symbol: "D", remark: "Pass", pass: true };
  if (p >= 40) return { symbol: "E", remark: "Satisfactory", pass: false };
  return { symbol: "U", remark: "Needs improvement", pass: false };
}

export interface ReportSubjectMark {
  subject: string;
  marks: number | null;
}

/**
 * Average of the subjects that actually have a numeric mark, to one decimal.
 * Returns null when nothing has been graded yet (so the UI shows "—").
 */
export function averageMark(lines: ReportSubjectMark[]): number | null {
  const graded = lines.filter(
    (l): l is { subject: string; marks: number } => typeof l.marks === "number",
  );
  if (graded.length === 0) return null;
  const sum = graded.reduce((s, l) => s + l.marks, 0);
  return Math.round((sum / graded.length) * 10) / 10;
}
