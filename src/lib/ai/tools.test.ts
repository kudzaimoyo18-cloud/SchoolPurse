import { describe, expect, test } from "vitest";
import { clampLimit, toolDefinitions, runTool } from "./tools";

describe("clampLimit", () => {
  test("falls back on invalid input", () => {
    expect(clampLimit(undefined, 10, 50)).toBe(10);
    expect(clampLimit("abc", 10, 50)).toBe(10);
    expect(clampLimit(0, 10, 50)).toBe(10);
    expect(clampLimit(-5, 10, 50)).toBe(10);
  });
  test("caps at max and floors fractions", () => {
    expect(clampLimit(999, 10, 50)).toBe(50);
    expect(clampLimit(7.9, 10, 50)).toBe(7);
    expect(clampLimit(25, 10, 50)).toBe(25);
  });
});

describe("toolDefinitions", () => {
  test("exposes only name/description/input_schema (no executor)", () => {
    const defs = toolDefinitions();
    expect(defs.length).toBeGreaterThan(0);
    for (const d of defs) {
      expect(typeof d.name).toBe("string");
      expect(typeof d.description).toBe("string");
      expect(d.input_schema.type).toBe("object");
      expect(d).not.toHaveProperty("run");
    }
  });
});

describe("runTool", () => {
  test("returns an error payload for an unknown tool (never throws)", async () => {
    await expect(runTool("does_not_exist", {})).resolves.toMatchObject({
      error: expect.stringContaining("Unknown tool"),
    });
  });
});
