import { describe, expect, test } from "vitest";
import { averageMark, zimsecGrade } from "./grading";

describe("zimsecGrade", () => {
  test("maps each band to its symbol", () => {
    expect(zimsecGrade(95).symbol).toBe("A");
    expect(zimsecGrade(80).symbol).toBe("A");
    expect(zimsecGrade(79).symbol).toBe("B");
    expect(zimsecGrade(70).symbol).toBe("B");
    expect(zimsecGrade(69).symbol).toBe("C");
    expect(zimsecGrade(60).symbol).toBe("C");
    expect(zimsecGrade(59).symbol).toBe("D");
    expect(zimsecGrade(50).symbol).toBe("D");
    expect(zimsecGrade(49).symbol).toBe("E");
    expect(zimsecGrade(40).symbol).toBe("E");
    expect(zimsecGrade(39).symbol).toBe("U");
    expect(zimsecGrade(0).symbol).toBe("U");
  });

  test("A–D pass, E and U fail", () => {
    expect(zimsecGrade(50).pass).toBe(true);
    expect(zimsecGrade(49).pass).toBe(false);
    expect(zimsecGrade(0).pass).toBe(false);
  });

  test("clamps out-of-range percentages", () => {
    expect(zimsecGrade(120).symbol).toBe("A");
    expect(zimsecGrade(-10).symbol).toBe("U");
  });
});

describe("averageMark", () => {
  test("averages only graded subjects, to one decimal", () => {
    expect(
      averageMark([
        { subject: "Maths", marks: 80 },
        { subject: "English", marks: 75 },
      ]),
    ).toBe(77.5);
  });

  test("ignores subjects with no mark", () => {
    expect(
      averageMark([
        { subject: "Maths", marks: 90 },
        { subject: "English", marks: null },
      ]),
    ).toBe(90);
  });

  test("returns null when nothing is graded", () => {
    expect(averageMark([{ subject: "Maths", marks: null }])).toBeNull();
    expect(averageMark([])).toBeNull();
  });
});
