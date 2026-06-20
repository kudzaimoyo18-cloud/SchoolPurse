// School levels + the starter class catalogue, shared by onboarding and
// settings so there's one source of truth. Pure + framework-free.

export const LEVELS = ["ecd", "primary", "secondary", "college"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABEL: Record<Level, string> = {
  ecd: "ECD",
  primary: "Primary",
  secondary: "Secondary",
  college: "College / Tertiary",
};

export const LEVEL_BLURB: Record<Level, string> = {
  ecd: "Nursery, reception & ECD A/B",
  primary: "Grade 1–7",
  secondary: "Form 1–6 (O & A level)",
  college: "Year 1–4 / tertiary",
};

// Default classes seeded when a level is enabled, so a new school can start
// enrolling immediately without typing every class by hand.
export const DEFAULT_CLASSES: Record<Level, string[]> = {
  ecd: ["ECD A", "ECD B"],
  primary: [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
  ],
  secondary: [
    "Form 1",
    "Form 2",
    "Form 3",
    "Form 4",
    "Form 5 (Lower 6)",
    "Form 6 (Upper 6)",
  ],
  college: ["Year 1", "Year 2", "Year 3", "Year 4"],
};
