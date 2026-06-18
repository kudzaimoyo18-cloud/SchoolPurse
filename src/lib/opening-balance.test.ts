import { describe, expect, test } from "vitest";
import { parseOpeningBalance } from "./opening-balance";

describe("parseOpeningBalance", () => {
  test("treats absent or blank cells as 0 (no balance)", () => {
    expect(parseOpeningBalance(undefined)).toBe(0);
    expect(parseOpeningBalance("")).toBe(0);
    expect(parseOpeningBalance("   ")).toBe(0);
  });

  test("parses a plain number", () => {
    expect(parseOpeningBalance("200")).toBe(200);
    expect(parseOpeningBalance("0")).toBe(0);
  });

  test("strips $ and thousands separators", () => {
    expect(parseOpeningBalance("$200")).toBe(200);
    expect(parseOpeningBalance("1,250")).toBe(1250);
    expect(parseOpeningBalance(" $1,250.50 ")).toBe(1250.5);
  });

  test("rounds to cents", () => {
    expect(parseOpeningBalance("19.999")).toBe(20);
    expect(parseOpeningBalance("19.994")).toBe(19.99);
  });

  test("rejects negative amounts", () => {
    expect(parseOpeningBalance("-50")).toBeNull();
  });

  test("rejects non-numeric input", () => {
    expect(parseOpeningBalance("abc")).toBeNull();
    expect(parseOpeningBalance("12x")).toBeNull();
  });

  test("rejects implausibly large amounts (likely a typo)", () => {
    expect(parseOpeningBalance("2000000")).toBeNull();
  });
});
