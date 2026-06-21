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
  test("Starter (free key) blocks the 51st student", () => {
    expect(exceedsStudentLimit("free", 49)).toBe(false); // 49 + 1 = 50 ok
    expect(exceedsStudentLimit("free", 50)).toBe(true); // 50 + 1 = 51 blocked
  });

  test("Starter respects a batch import that would cross the cap", () => {
    expect(exceedsStudentLimit("free", 30, 20)).toBe(false); // 50 ok
    expect(exceedsStudentLimit("free", 30, 21)).toBe(true); // 51 blocked
  });

  test("Pro caps at 250 students", () => {
    expect(exceedsStudentLimit("pro", 249)).toBe(false); // 250 ok
    expect(exceedsStudentLimit("pro", 250)).toBe(true); // 251 blocked
  });

  test("AI is uncapped", () => {
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
  test("Starter (free key) caps at 50 students / 1 user", () => {
    expect(PLAN_LIMITS.free.maxStudents).toBe(50);
    expect(PLAN_LIMITS.free.maxUsers).toBe(1);
  });
  test("Pro caps at 250 students", () => {
    expect(PLAN_LIMITS.pro.maxStudents).toBe(250);
  });
  test("AI is unlimited students", () => {
    expect(PLAN_LIMITS.ai.maxStudents).toBe(Number.POSITIVE_INFINITY);
  });
});
