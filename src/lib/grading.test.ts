import { describe, expect, test } from "vitest";
import {
  averageMark,
  defaultScheme,
  ECD_RATINGS,
  gradeFor,
} from "./grading";

describe("gradeFor — O-Level (ZIMSEC)", () => {
  test("bands and credit-pass at C (>= 50%)", () => {
    expect(gradeFor("olevel", 75)).toMatchObject({ symbol: "A", pass: true });
    expect(gradeFor("olevel", 65)).toMatchObject({ symbol: "B", pass: true });
    expect(gradeFor("olevel", 50)).toMatchObject({ symbol: "C", pass: true });
    expect(gradeFor("olevel", 49)).toMatchObject({ symbol: "D", pass: false });
    expect(gradeFor("olevel", 30)).toMatchObject({ symbol: "E", pass: false });
    expect(gradeFor("olevel", 29)).toMatchObject({ symbol: "U", pass: false });
  });
});

describe("gradeFor — A-Level (ZIMSEC)", () => {
  test("bands, points and E-pass (>= 40%)", () => {
    expect(gradeFor("alevel", 80)).toMatchObject({ symbol: "A", points: 5 });
    expect(gradeFor("alevel", 60)).toMatchObject({ symbol: "C", points: 3 });
    expect(gradeFor("alevel", 40)).toMatchObject({
      symbol: "E",
      points: 1,
      pass: true,
    });
    expect(gradeFor("alevel", 39)).toMatchObject({
      symbol: "U",
      points: 0,
      pass: false,
    });
  });
});

describe("gradeFor — College / TVET", () => {
  test("distinction / credit / pass / fail", () => {
    expect(gradeFor("college", 75).remark).toBe("Distinction");
    expect(gradeFor("college", 60).remark).toBe("Credit");
    expect(gradeFor("college", 50).remark).toBe("Pass");
    expect(gradeFor("college", 49)).toMatchObject({
      remark: "Fail",
      pass: false,
    });
  });
});

describe("gradeFor — Primary units (1 best .. 9)", () => {
  test("maps % to units, 1 is best", () => {
    expect(gradeFor("primary", 95).symbol).toBe("1");
    expect(gradeFor("primary", 50).symbol).toBe("5");
    expect(gradeFor("primary", 10).symbol).toBe("9");
  });
});

describe("gradeFor — clamping", () => {
  test("clamps out-of-range", () => {
    expect(gradeFor("olevel", 200).symbol).toBe("A");
    expect(gradeFor("olevel", -5).symbol).toBe("U");
  });
});

describe("defaultScheme", () => {
  test("detects ECD by class name", () => {
    expect(defaultScheme("primary", "ECD A")).toBe("ecd");
    expect(defaultScheme("primary", "Reception")).toBe("ecd");
  });
  test("primary classes use the units scheme", () => {
    expect(defaultScheme("primary", "Grade 5")).toBe("primary");
  });
  test("Form 1-4 → O-Level, Form 5/6 → A-Level", () => {
    expect(defaultScheme("secondary", "Form 3")).toBe("olevel");
    expect(defaultScheme("secondary", "Form 5 (Lower 6)")).toBe("alevel");
    expect(defaultScheme("secondary", "Upper 6")).toBe("alevel");
  });
  test("college (and legacy tertiary) → college", () => {
    expect(defaultScheme("college", "Year 1")).toBe("college");
    expect(defaultScheme("tertiary", "Year 1")).toBe("college");
  });
  test("ecd level → ecd scheme", () => {
    expect(defaultScheme("ecd", "ECD A")).toBe("ecd");
  });
});

describe("ECD ratings", () => {
  test("are descriptors, with the lowest flagged not-pass", () => {
    expect(ECD_RATINGS.map((r) => r.value)).toContain("competent");
    expect(ECD_RATINGS.find((r) => r.value === "support")?.pass).toBe(false);
  });
});

describe("averageMark", () => {
  test("averages graded subjects to one decimal", () => {
    expect(
      averageMark([
        { subject: "Maths", marks: 80 },
        { subject: "English", marks: 75 },
      ]),
    ).toBe(77.5);
  });
  test("ignores ungraded and returns null when empty", () => {
    expect(
      averageMark([
        { subject: "Maths", marks: 90 },
        { subject: "English", marks: null },
      ]),
    ).toBe(90);
    expect(averageMark([])).toBeNull();
  });
});
