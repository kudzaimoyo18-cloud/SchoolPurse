import { describe, expect, test } from "vitest";
import {
  aggregateMonthlyPL,
  aggregateYearToDate,
  type MonthlyPLExpenseRow,
  type MonthlyPLPaymentRow,
} from "./monthly-pl";

// All time anchors below are pinned so the trailing-window math is
// reproducible across machines and timezones. `now` represents
// 29 May 2026 — picked because it's the head of the working tree.

const NOW = new Date(2026, 4, 29); // May = month index 4

describe("aggregateMonthlyPL — bucket layout", () => {
  test("always returns the requested number of buckets, in ascending order", () => {
    const result = aggregateMonthlyPL([], [], NOW, 6);
    expect(result).toHaveLength(6);
    expect(result.map((r) => r.key)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
  });

  test("respects a custom months count", () => {
    const result = aggregateMonthlyPL([], [], NOW, 3);
    expect(result.map((r) => r.key)).toEqual(["2026-03", "2026-04", "2026-05"]);
  });

  test("returns empty buckets (0/0/0%) when there is no activity", () => {
    const [first] = aggregateMonthlyPL([], [], NOW, 1);
    expect(first).toMatchObject({
      key: "2026-05",
      income: 0,
      expenses: 0,
      net: 0,
      margin: 0,
    });
  });

  test("labels and shortLabels are formatted consistently", () => {
    const result = aggregateMonthlyPL([], [], NOW, 2);
    expect(result[0]).toMatchObject({
      key: "2026-04",
      label: "Apr 2026",
      shortLabel: "Apr",
    });
    expect(result[1]).toMatchObject({
      key: "2026-05",
      label: "May 2026",
      shortLabel: "May",
    });
  });

  test("crosses year boundaries cleanly", () => {
    const earlyFebruary = new Date(2026, 1, 5);
    const result = aggregateMonthlyPL([], [], earlyFebruary, 4);
    expect(result.map((r) => r.key)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("aggregateMonthlyPL — income and expense bucketing", () => {
  test("buckets payments by paid_at month", () => {
    const payments: MonthlyPLPaymentRow[] = [
      { amount_usd: 100, paid_at: "2026-05-01T08:00:00Z" },
      { amount_usd: 200, paid_at: "2026-05-15T08:00:00Z" },
      { amount_usd: 50, paid_at: "2026-04-20T08:00:00Z" },
    ];

    const result = aggregateMonthlyPL(payments, [], NOW, 2);
    const apr = result.find((r) => r.key === "2026-04");
    const may = result.find((r) => r.key === "2026-05");
    expect(apr?.income).toBe(50);
    expect(may?.income).toBe(300);
  });

  test("buckets expenses by expense_date month", () => {
    const expenses: MonthlyPLExpenseRow[] = [
      { amount_usd: 30, expense_date: "2026-05-02" },
      { amount_usd: 70, expense_date: "2026-05-28" },
      { amount_usd: 25, expense_date: "2026-04-10" },
    ];

    const result = aggregateMonthlyPL([], expenses, NOW, 2);
    expect(result.find((r) => r.key === "2026-04")?.expenses).toBe(25);
    expect(result.find((r) => r.key === "2026-05")?.expenses).toBe(100);
  });

  test("ignores rows that fall outside the trailing window", () => {
    // A 6-month window from May 2026 covers Dec 2025 → May 2026.
    // Anything earlier (e.g. Nov 2025) must be dropped silently. Picking
    // mid-month so timezone shifts can't bump the row into the window.
    const payments: MonthlyPLPaymentRow[] = [
      { amount_usd: 9999, paid_at: "2025-11-15T12:00:00Z" }, // out of window
      { amount_usd: 100, paid_at: "2026-05-01T12:00:00Z" }, // in window
    ];

    const result = aggregateMonthlyPL(payments, [], NOW, 6);
    const totalIncome = result.reduce((s, r) => s + r.income, 0);
    expect(totalIncome).toBe(100);
  });

  test("ignores future-dated rows when they fall outside the window", () => {
    const payments: MonthlyPLPaymentRow[] = [
      { amount_usd: 500, paid_at: "2026-07-15T08:00:00Z" }, // after window end
    ];

    const result = aggregateMonthlyPL(payments, [], NOW, 6);
    const totalIncome = result.reduce((s, r) => s + r.income, 0);
    expect(totalIncome).toBe(0);
  });

  test("coerces string amounts (Postgres numeric → string in Supabase)", () => {
    const payments: MonthlyPLPaymentRow[] = [
      { amount_usd: "100.50", paid_at: "2026-05-01T08:00:00Z" },
      { amount_usd: "49.50", paid_at: "2026-05-02T08:00:00Z" },
    ];

    const result = aggregateMonthlyPL(payments, [], NOW, 1);
    expect(result[0].income).toBe(150);
  });
});

describe("aggregateMonthlyPL — net and margin", () => {
  test("net = income − expenses (positive)", () => {
    const result = aggregateMonthlyPL(
      [{ amount_usd: 1000, paid_at: "2026-05-10T08:00:00Z" }],
      [{ amount_usd: 300, expense_date: "2026-05-15" }],
      NOW,
      1,
    );
    expect(result[0].net).toBe(700);
  });

  test("net is negative when expenses exceed income", () => {
    const result = aggregateMonthlyPL(
      [{ amount_usd: 100, paid_at: "2026-05-10T08:00:00Z" }],
      [{ amount_usd: 250, expense_date: "2026-05-15" }],
      NOW,
      1,
    );
    expect(result[0].net).toBe(-150);
    expect(result[0].margin).toBe(-150); // (−150 / 100) × 100
  });

  test("margin is income-based: zero income → zero margin even with expenses", () => {
    // Avoids the "divide by zero shows Infinity in the UI" bug class.
    const result = aggregateMonthlyPL(
      [],
      [{ amount_usd: 250, expense_date: "2026-05-15" }],
      NOW,
      1,
    );
    expect(result[0].income).toBe(0);
    expect(result[0].expenses).toBe(250);
    expect(result[0].net).toBe(-250);
    expect(result[0].margin).toBe(0);
  });

  test("margin is 100% when there are no expenses", () => {
    const result = aggregateMonthlyPL(
      [{ amount_usd: 500, paid_at: "2026-05-10T08:00:00Z" }],
      [],
      NOW,
      1,
    );
    expect(result[0].margin).toBe(100);
  });

  test("margin is expressed as a percentage scaled 0..100, not a ratio", () => {
    // Pin the unit contract — bursars read this directly.
    const result = aggregateMonthlyPL(
      [{ amount_usd: 1000, paid_at: "2026-05-10T08:00:00Z" }],
      [{ amount_usd: 250, expense_date: "2026-05-15" }],
      NOW,
      1,
    );
    // (1000 − 250) / 1000 × 100 = 75
    expect(result[0].margin).toBe(75);
  });
});

describe("aggregateMonthlyPL — multi-month rollup", () => {
  test("totals across the window match per-bucket sums", () => {
    const payments: MonthlyPLPaymentRow[] = [
      { amount_usd: 100, paid_at: "2026-03-15T08:00:00Z" },
      { amount_usd: 200, paid_at: "2026-04-10T08:00:00Z" },
      { amount_usd: 300, paid_at: "2026-05-20T08:00:00Z" },
    ];
    const expenses: MonthlyPLExpenseRow[] = [
      { amount_usd: 50, expense_date: "2026-03-25" },
      { amount_usd: 75, expense_date: "2026-04-30" },
    ];

    const result = aggregateMonthlyPL(payments, expenses, NOW, 3);
    expect(result.find((r) => r.key === "2026-03")).toMatchObject({
      income: 100,
      expenses: 50,
      net: 50,
    });
    expect(result.find((r) => r.key === "2026-04")).toMatchObject({
      income: 200,
      expenses: 75,
      net: 125,
    });
    expect(result.find((r) => r.key === "2026-05")).toMatchObject({
      income: 300,
      expenses: 0,
      net: 300,
    });
  });
});

describe("aggregateYearToDate", () => {
  test("sums income, expenses, and computes net + margin", () => {
    const result = aggregateYearToDate(
      [{ amount_usd: 1000 }, { amount_usd: 500 }],
      [{ amount_usd: 300 }, { amount_usd: 200 }],
    );
    expect(result).toEqual({
      income: 1500,
      expenses: 500,
      net: 1000,
      margin: (1000 / 1500) * 100,
    });
  });

  test("returns zeros for empty input", () => {
    expect(aggregateYearToDate([], [])).toEqual({
      income: 0,
      expenses: 0,
      net: 0,
      margin: 0,
    });
  });

  test("margin is 0 when income is 0, even if there are expenses", () => {
    const result = aggregateYearToDate(
      [],
      [{ amount_usd: 250 }],
    );
    expect(result.margin).toBe(0);
    expect(result.net).toBe(-250);
  });

  test("tolerates null amount_usd values", () => {
    const result = aggregateYearToDate(
      [{ amount_usd: null }, { amount_usd: 100 }],
      [{ amount_usd: null }],
    );
    expect(result.income).toBe(100);
    expect(result.expenses).toBe(0);
  });

  test("coerces string amounts (Postgres numeric)", () => {
    const result = aggregateYearToDate(
      [{ amount_usd: "750.25" }, { amount_usd: "100.75" }],
      [{ amount_usd: "200" }],
    );
    expect(result.income).toBe(851);
    expect(result.expenses).toBe(200);
    expect(result.net).toBe(651);
  });
});
