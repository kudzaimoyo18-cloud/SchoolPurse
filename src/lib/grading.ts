// Level-aware grading for the E-Report Book. Zimbabwe grades each level
// differently, and ECD/Primary/Secondary/College are all target clients, so a
// single scale won't do.
//
//   ecd      — competency descriptors, NO marks (see ECD_RATINGS)
//   primary  — ZIMSEC units 1 (best) .. 9 (worst)
//   olevel   — ZIMSEC O-Level A–U (A 75, B 65, C 50 credit/pass, D 40, E 30, U <30)
//   alevel   — ZIMSEC A-Level A–U with points (A 80=5 .. E 40=1 pass, U <40=0)
//   college  — TVET/polytechnic Distinction / Credit / Pass / Fail
//
// Band %s for primary are illustrative and easy to tweak per school; the
// O-Level, A-Level and college thresholds follow the published standards.
// Pure + framework-free for easy testing.

export type GradingScheme = "ecd" | "primary" | "olevel" | "alevel" | "college";

export interface GradeResult {
  /** What prints on the report: a letter, a unit number, or a descriptor. */
  symbol: string;
  remark: string;
  pass: boolean;
  /** A-Level points (5..0); undefined for other schemes. */
  points?: number;
}

interface Band {
  min: number;
  symbol: string;
  remark: string;
  pass: boolean;
  points?: number;
}

// ZIMSEC O-Level: credit (pass) is C / >= 50%.
const OLEVEL_BANDS: Band[] = [
  { min: 75, symbol: "A", remark: "Distinction", pass: true },
  { min: 65, symbol: "B", remark: "Merit", pass: true },
  { min: 50, symbol: "C", remark: "Credit", pass: true },
  { min: 40, symbol: "D", remark: "Satisfactory", pass: false },
  { min: 30, symbol: "E", remark: "Fail", pass: false },
  { min: 0, symbol: "U", remark: "Unsatisfactory", pass: false },
];

// ZIMSEC A-Level: E (>= 40%) is the lowest pass; U scores no points.
const ALEVEL_BANDS: Band[] = [
  { min: 80, symbol: "A", remark: "Excellent", pass: true, points: 5 },
  { min: 70, symbol: "B", remark: "Very good", pass: true, points: 4 },
  { min: 60, symbol: "C", remark: "Good", pass: true, points: 3 },
  { min: 50, symbol: "D", remark: "Satisfactory", pass: true, points: 2 },
  { min: 40, symbol: "E", remark: "Pass", pass: true, points: 1 },
  { min: 0, symbol: "U", remark: "Fail", pass: false, points: 0 },
];

// TVET / polytechnic style classification.
const COLLEGE_BANDS: Band[] = [
  { min: 75, symbol: "DIST", remark: "Distinction", pass: true },
  { min: 60, symbol: "CRED", remark: "Credit", pass: true },
  { min: 50, symbol: "PASS", remark: "Pass", pass: true },
  { min: 0, symbol: "FAIL", remark: "Fail", pass: false },
];

// ZIMSEC primary units (1 best .. 9 worst). %→unit bands are illustrative.
const PRIMARY_BANDS: Band[] = [
  { min: 90, symbol: "1", remark: "Outstanding", pass: true },
  { min: 80, symbol: "2", remark: "Excellent", pass: true },
  { min: 70, symbol: "3", remark: "Very good", pass: true },
  { min: 60, symbol: "4", remark: "Good", pass: true },
  { min: 50, symbol: "5", remark: "Satisfactory", pass: true },
  { min: 40, symbol: "6", remark: "Fair", pass: false },
  { min: 30, symbol: "7", remark: "Weak", pass: false },
  { min: 20, symbol: "8", remark: "Poor", pass: false },
  { min: 0, symbol: "9", remark: "Very poor", pass: false },
];

const BANDS: Record<Exclude<GradingScheme, "ecd">, Band[]> = {
  olevel: OLEVEL_BANDS,
  alevel: ALEVEL_BANDS,
  college: COLLEGE_BANDS,
  primary: PRIMARY_BANDS,
};

/** Grade a percentage under a numeric scheme. ECD has no percentage grade. */
export function gradeFor(
  scheme: Exclude<GradingScheme, "ecd">,
  percent: number,
): GradeResult {
  const p = Math.max(0, Math.min(100, percent));
  const bands = BANDS[scheme];
  const band = bands.find((b) => p >= b.min) ?? bands[bands.length - 1];
  return {
    symbol: band.symbol,
    remark: band.remark,
    pass: band.pass,
    points: band.points,
  };
}

// ECD competency ratings (non-numeric). The report records one of these per
// skill area instead of a mark.
export type EcdRating = "excellent" | "competent" | "developing" | "support";

export const ECD_RATINGS: { value: EcdRating; label: string; pass: boolean }[] =
  [
    { value: "excellent", label: "Excellent", pass: true },
    { value: "competent", label: "Competent", pass: true },
    { value: "developing", label: "Developing", pass: true },
    { value: "support", label: "Needs support", pass: false },
  ];

// ECD reports are built around developmental skill areas (rated with
// ECD_RATINGS) rather than academic subjects. Schools can adjust this list.
export const ECD_SKILL_AREAS = [
  "Language & Literacy",
  "Mathematics & Numeracy",
  "Physical Development",
  "Social & Emotional",
  "Creative Arts",
  "Science & Environment",
] as const;

/**
 * Pick the default grading scheme for a class from its level + name. ECD is
 * detected by name (ECD classes live under the `primary` level in the schema);
 * Form 5/6 (Lower/Upper 6) map to A-Level, other secondary to O-Level.
 */
export type ClassLevel =
  | "ecd"
  | "primary"
  | "secondary"
  | "college"
  // tertiary kept for legacy rows migrated to college
  | "tertiary";

export function defaultScheme(
  level: ClassLevel | null | undefined,
  className?: string,
): GradingScheme {
  const name = (className ?? "").toLowerCase();
  if (level === "ecd") return "ecd";
  if (/\becd\b|nursery|reception|\bgrade\s*0\b/.test(name)) return "ecd";
  if (level === "college" || level === "tertiary") return "college";
  if (level === "secondary") {
    if (/lower\s*6|upper\s*6|form\s*[56]|a-?level/.test(name)) return "alevel";
    return "olevel";
  }
  return "primary";
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
