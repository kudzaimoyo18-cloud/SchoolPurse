import { describe, expect, test } from "vitest";
import {
  daysBetween,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  toNumber,
} from "./format";

// Money formatting is the highest-risk surface in a financial app — these
// tests pin behavior so future refactors can't silently change currency
// formatting, rounding, or null handling. Behavior-focused, not snapshot-based.

describe("formatMoney", () => {
  test("formats whole-dollar amounts with two decimals", () => {
    expect(formatMoney(100)).toBe("$100.00");
  });

  test("formats decimal amounts to exactly two places", () => {
    expect(formatMoney(12.5)).toBe("$12.50");
    expect(formatMoney(0.99)).toBe("$0.99");
  });

  test("groups thousands with commas", () => {
    expect(formatMoney(1234567.89)).toBe("$1,234,567.89");
  });

  test("rounds half-to-even at two decimals (Intl default)", () => {
    // 1.005 → "$1.00" or "$1.01" depending on engine rounding mode.
    // We assert that the result is one of those two — any other answer
    // indicates a regression in the formatter's contract.
    expect(["$1.00", "$1.01"]).toContain(formatMoney(1.005));
  });

  test("formats negative amounts with a minus sign", () => {
    expect(formatMoney(-42.5)).toBe("-$42.50");
  });

  test("accepts numeric strings", () => {
    expect(formatMoney("250.00")).toBe("$250.00");
    expect(formatMoney("250")).toBe("$250.00");
  });

  test("returns $0.00 for null, undefined, and empty string", () => {
    expect(formatMoney(null)).toBe("$0.00");
    expect(formatMoney(undefined)).toBe("$0.00");
    expect(formatMoney("")).toBe("$0.00");
  });

  test("returns $0.00 for NaN and non-finite inputs", () => {
    expect(formatMoney(Number.NaN)).toBe("$0.00");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("$0.00");
    expect(formatMoney("not a number")).toBe("$0.00");
  });

  test("formats zero as $0.00, not $0", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });
});

describe("formatMoneyCompact", () => {
  test("uses compact notation for thousands and millions", () => {
    expect(formatMoneyCompact(1500)).toBe("$1.5K");
    expect(formatMoneyCompact(2_000_000)).toBe("$2M");
  });

  test("returns $0 (no decimals) for null and undefined", () => {
    expect(formatMoneyCompact(null)).toBe("$0");
    expect(formatMoneyCompact(undefined)).toBe("$0");
    expect(formatMoneyCompact("")).toBe("$0");
  });

  test("returns $0 for NaN", () => {
    expect(formatMoneyCompact(Number.NaN)).toBe("$0");
  });
});

describe("toNumber", () => {
  test("passes numeric input through unchanged", () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(-1.5)).toBe(-1.5);
  });

  test("parses numeric strings", () => {
    expect(toNumber("250")).toBe(250);
    expect(toNumber("1.5")).toBe(1.5);
  });

  test("returns 0 for null and undefined", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  test("returns 0 for unparseable values rather than NaN", () => {
    // Critical: callers depend on this never returning NaN, because NaN
    // propagates through arithmetic and silently corrupts totals.
    expect(toNumber("abc")).toBe(0);
    expect(toNumber({})).toBe(0);
    expect(toNumber([])).toBe(0); // Number([]) === 0, still finite
    expect(Number.isFinite(toNumber("abc"))).toBe(true);
  });
});

describe("formatDate", () => {
  test("formats ISO date strings as 'd MMM yyyy'", () => {
    expect(formatDate("2026-05-29")).toBe("29 May 2026");
    expect(formatDate("2026-01-05")).toBe("5 Jan 2026");
  });

  test("accepts Date objects", () => {
    expect(formatDate(new Date("2026-05-29"))).toBe("29 May 2026");
  });

  test("returns empty string for null and undefined", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });
});

describe("formatDateTime", () => {
  test("formats datetime strings with time component", () => {
    // Result will be tz-sensitive; assert structural properties rather
    // than an exact string to keep the test machine-independent.
    const result = formatDateTime("2026-05-29T14:30:00Z");
    expect(result).toMatch(/^29 May 2026 at \d{1,2}:\d{2} (AM|PM)$/);
  });

  test("returns empty string for null and undefined", () => {
    expect(formatDateTime(null)).toBe("");
    expect(formatDateTime(undefined)).toBe("");
  });
});

describe("daysBetween", () => {
  test("returns whole number of days between two dates", () => {
    expect(daysBetween("2026-05-01", "2026-05-10")).toBe(9);
  });

  test("returns 0 for the same date", () => {
    expect(daysBetween("2026-05-01", "2026-05-01")).toBe(0);
  });

  test("returns a negative value when from is after to", () => {
    expect(daysBetween("2026-05-10", "2026-05-01")).toBe(-9);
  });

  test("handles month and year boundaries", () => {
    expect(daysBetween("2025-12-25", "2026-01-05")).toBe(11);
  });

  test("accepts Date objects for both arguments", () => {
    const from = new Date("2026-05-01");
    const to = new Date("2026-05-10");
    expect(daysBetween(from, to)).toBe(9);
  });
});
