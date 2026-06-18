import { describe, expect, test } from "vitest";
import {
  exceedsStudentLimit,
  exceedsUserLimit,
  normalizePlan,
  PLAN_LIMITS,
} from "./plan";

describe("normalizePlan", () => {
  test("accepts known plans", () => {
    expect(normalizePlan("pro")).toBe("pro");
    expect(normalizePlan("ai")).toBe("ai");
    expect(normalizePlan("free")).toBe("free");
  });

  test("defaults unknown / null to free", () => {
    expect(normalizePlan(null)).toBe("free");
    expect(normalizePlan(undefined)).toBe("free");
    expect(normalizePlan("enterprise")).toBe("free");
    expect(normalizePlan(42)).toBe("free");
  });
});

describe("exceedsStudentLimit", () => {
  test("free blocks the 101st student", () => {
    expect(exceedsStudentLimit("free", 99)).toBe(false); // 99 + 1 = 100 ok
    expect(exceedsStudentLimit("free", 100)).toBe(true); // 100 + 1 = 101 blocked
  });

  test("free respects a batch import that would cross the cap", () => {
    expect(exceedsStudentLimit("free", 80, 20)).toBe(false); // 100 ok
    expect(exceedsStudentLimit("free", 80, 21)).toBe(true); // 101 blocked
  });

  test("pro and ai are uncapped", () => {
    expect(exceedsStudentLimit("pro", 100_000)).toBe(false);
    expect(exceedsStudentLimit("ai", 100_000, 5000)).toBe(false);
  });
});

describe("exceedsUserLimit", () => {
  test("free allows exactly one user", () => {
    expect(exceedsUserLimit("free", 0)).toBe(false); // first user
    expect(exceedsUserLimit("free", 1)).toBe(true); // second blocked
  });

  test("pro and ai are uncapped", () => {
    expect(exceedsUserLimit("pro", 50)).toBe(false);
    expect(exceedsUserLimit("ai", 50)).toBe(false);
  });
});

describe("PLAN_LIMITS", () => {
  test("free caps at 100 students / 1 user", () => {
    expect(PLAN_LIMITS.free.maxStudents).toBe(100);
    expect(PLAN_LIMITS.free.maxUsers).toBe(1);
  });
});
