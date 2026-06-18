import { describe, expect, test } from "vitest";
import {
  aggregateArrears,
  type ArrearsInvoiceRow,
} from "./arrears";

// Pure aggregation tests for arrears. The fetch layer is excluded by design —
// these tests pin the financial behavior contract that bursars depend on for
// monthly close. Every test fixes `today` so date math is deterministic.

const TODAY = new Date("2026-05-29T00:00:00Z");

// Helper to keep fixtures terse. Defaults mirror the most common shape.
function inv(overrides: Partial<ArrearsInvoiceRow> = {}): ArrearsInvoiceRow {
  return {
    id: "inv-1",
    student_id: "stu-1",
    total_usd: 100,
    due_date: "2026-05-01",
    status: "open",
    students: {
      first_name: "Tendai",
      last_name: "Moyo",
      classes: { name: "Grade 5" },
    },
    invoice_lines: [],
    ...overrides,
  };
}

describe("aggregateArrears — basic balance math", () => {
  test("returns one student per student_id, balance = total − paid", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        invoice_lines: [
          { amount_usd: 100, paid_usd: 40, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      student_id: "stu-1",
      student_name: "Tendai Moyo",
      class_name: "Grade 5",
      term_fee: 100,
      paid: 40,
      balance: 60,
      invoice_ids: ["inv-1"],
    });
  });

  test("falls back to invoice.total_usd when no lines are present", () => {
    const rows = [
      inv({
        total_usd: 250,
        invoice_lines: [],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].term_fee).toBe(250);
    expect(result[0].balance).toBe(250);
  });

  test("clamps negative balances to zero", () => {
    // Overpaid invoice — should never show as a negative balance,
    // and balance ≤ 0.0001 means it gets dropped entirely.
    const rows = [
      inv({
        invoice_lines: [
          { amount_usd: 100, paid_usd: 150, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result).toHaveLength(0);
  });

  test("drops invoices fully paid (within float-dust tolerance)", () => {
    const rows = [
      inv({
        invoice_lines: [
          { amount_usd: 100, paid_usd: 100, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result).toHaveLength(0);
  });

  test("does NOT drop invoices with a balance just above the float-dust threshold", () => {
    const rows = [
      inv({
        invoice_lines: [
          { amount_usd: 100, paid_usd: 99.99, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].balance).toBeCloseTo(0.01, 5);
  });
});

describe("aggregateArrears — payment_allocations are the source of truth", () => {
  test("uses MAX(paid_usd, sum-of-allocations) — allocations win when bigger", () => {
    // Common case: bursar entered a payment that wrote payment_allocations
    // but didn't bump invoice_lines.paid_usd. Aggregation must still count
    // the payment.
    const rows = [
      inv({
        invoice_lines: [
          {
            amount_usd: 200,
            paid_usd: 0,
            payment_allocations: [
              { amount_usd: 120, payments: { status: "completed" } },
            ],
          },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].paid).toBe(120);
    expect(result[0].balance).toBe(80);
  });

  test("uses MAX(paid_usd, sum-of-allocations) — paid_usd wins when bigger", () => {
    // If a manual reconciliation has updated paid_usd directly but no
    // allocation rows exist, that's still legitimate.
    const rows = [
      inv({
        invoice_lines: [
          {
            amount_usd: 200,
            paid_usd: 150,
            payment_allocations: [
              { amount_usd: 50, payments: { status: "completed" } },
            ],
          },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].paid).toBe(150);
    expect(result[0].balance).toBe(50);
  });

  test("carry-over line: prior payment + new allocation both count (regression)", () => {
    // Repro of the Test Moyo bug: a $500 term fee carried over with $300 paid
    // before SchoolPurse, then a $100 payment recorded in-app. The durable
    // carry-over base ($300) lives in the line's paid_usd alongside the $100
    // allocation, so paid_usd = 400 and balance = 100 — NOT 500 − 100 = 400.
    // paid_usd (400) must win over sum-of-allocations (100).
    const rows = [
      inv({
        total_usd: 500,
        invoice_lines: [
          {
            amount_usd: 500,
            paid_usd: 400, // carry_over_paid_usd(300) + allocation(100)
            payment_allocations: [
              { amount_usd: 100, payments: { status: "completed" } },
            ],
          },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].paid).toBe(400);
    expect(result[0].balance).toBe(100);
  });

  test("excludes void payment allocations", () => {
    // A voided receipt MUST NOT count toward paid. This is the single most
    // important invariant — getting it wrong overstates collections.
    const rows = [
      inv({
        invoice_lines: [
          {
            amount_usd: 200,
            paid_usd: 0,
            payment_allocations: [
              { amount_usd: 80, payments: { status: "completed" } },
              { amount_usd: 50, payments: { status: "void" } },
            ],
          },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].paid).toBe(80);
    expect(result[0].balance).toBe(120);
  });

  test("handles payments as an array (Supabase nested-select quirk)", () => {
    // The same payment ref may arrive as an object or a single-element array
    // depending on the nested select shape — both must work.
    const rows = [
      inv({
        invoice_lines: [
          {
            amount_usd: 100,
            paid_usd: 0,
            payment_allocations: [
              { amount_usd: 70, payments: [{ status: "completed" }] },
            ],
          },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].paid).toBe(70);
  });

  test("sums multiple lines on one invoice correctly", () => {
    const rows = [
      inv({
        invoice_lines: [
          {
            amount_usd: 100,
            paid_usd: 0,
            payment_allocations: [
              { amount_usd: 50, payments: { status: "completed" } },
            ],
          },
          {
            amount_usd: 200,
            paid_usd: 0,
            payment_allocations: [
              { amount_usd: 100, payments: { status: "completed" } },
            ],
          },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].term_fee).toBe(300);
    expect(result[0].paid).toBe(150);
    expect(result[0].balance).toBe(150);
  });
});

describe("aggregateArrears — days overdue", () => {
  test("computes overdue days from due_date to today", () => {
    const rows = [
      inv({
        due_date: "2026-05-01", // 28 days before TODAY (2026-05-29)
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].days_overdue).toBe(28);
  });

  test("clamps overdue to 0 when due_date is in the future", () => {
    // A future-dated invoice is not yet overdue. Never report negative aging.
    const rows = [
      inv({
        due_date: "2026-06-15", // future
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].days_overdue).toBe(0);
  });

  test("treats missing due_date as 0 days overdue", () => {
    const rows = [
      inv({
        due_date: null,
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].days_overdue).toBe(0);
  });
});

describe("aggregateArrears — multi-invoice rollup per student", () => {
  test("sums term_fee, paid, balance across a student's invoices", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        id: "inv-1",
        invoice_lines: [
          { amount_usd: 100, paid_usd: 20, payment_allocations: [] },
        ],
      }),
      inv({
        id: "inv-2",
        invoice_lines: [
          { amount_usd: 200, paid_usd: 50, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].term_fee).toBe(300);
    expect(result[0].paid).toBe(70);
    expect(result[0].balance).toBe(230);
    expect(result[0].invoice_ids).toEqual(["inv-1", "inv-2"]);
  });

  test("uses the MAX days_overdue across rolled-up invoices", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        id: "inv-1",
        due_date: "2026-05-20", // 9 days overdue
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
      inv({
        id: "inv-2",
        due_date: "2026-04-29", // 30 days overdue
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].days_overdue).toBe(30);
  });

  test("does not merge invoices from different students", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        id: "inv-1",
        student_id: "stu-1",
        students: { first_name: "A", last_name: "One" },
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
      inv({
        id: "inv-2",
        student_id: "stu-2",
        students: { first_name: "B", last_name: "Two" },
        invoice_lines: [
          { amount_usd: 50, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result).toHaveLength(2);
  });
});

describe("aggregateArrears — sorting", () => {
  test("sorts by balance descending (heaviest debts first)", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        id: "inv-small",
        student_id: "stu-small",
        students: { first_name: "Small", last_name: "Debt" },
        invoice_lines: [
          { amount_usd: 50, paid_usd: 0, payment_allocations: [] },
        ],
      }),
      inv({
        id: "inv-big",
        student_id: "stu-big",
        students: { first_name: "Big", last_name: "Debt" },
        invoice_lines: [
          { amount_usd: 500, paid_usd: 0, payment_allocations: [] },
        ],
      }),
      inv({
        id: "inv-mid",
        student_id: "stu-mid",
        students: { first_name: "Mid", last_name: "Debt" },
        invoice_lines: [
          { amount_usd: 200, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result.map((r) => r.student_name)).toEqual([
      "Big Debt",
      "Mid Debt",
      "Small Debt",
    ]);
  });
});

describe("aggregateArrears — Supabase nested-select shape quirks", () => {
  test("accepts students as an array (single-element)", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        students: [
          { first_name: "Array", last_name: "Student", classes: { name: "Grade 1" } },
        ],
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].student_name).toBe("Array Student");
    expect(result[0].class_name).toBe("Grade 1");
  });

  test("accepts classes as an array", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        students: {
          first_name: "Class",
          last_name: "Array",
          classes: [{ name: "Grade 7" }],
        },
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].class_name).toBe("Grade 7");
  });

  test("returns null class_name when class info is missing", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        students: { first_name: "No", last_name: "Class" },
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].class_name).toBeNull();
  });

  test("skips rows where students field is null", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({ id: "inv-orphan", students: null }),
      inv({
        id: "inv-good",
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].invoice_ids).toEqual(["inv-good"]);
  });

  test("trims student name when first or last is missing", () => {
    const rows: ArrearsInvoiceRow[] = [
      inv({
        students: { first_name: "Tendai", last_name: undefined },
        invoice_lines: [
          { amount_usd: 100, paid_usd: 0, payment_allocations: [] },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].student_name).toBe("Tendai");
  });
});

describe("aggregateArrears — input edge cases", () => {
  test("returns empty array for empty input", () => {
    expect(aggregateArrears([], TODAY)).toEqual([]);
  });

  test("handles string numbers (Postgres numeric → string)", () => {
    // Supabase returns numeric columns as strings. The aggregation must
    // coerce them rather than concatenate.
    const rows: ArrearsInvoiceRow[] = [
      inv({
        total_usd: "100",
        invoice_lines: [
          {
            amount_usd: "100",
            paid_usd: "40",
            payment_allocations: [
              { amount_usd: "10", payments: { status: "completed" } },
            ],
          },
        ],
      }),
    ];

    const result = aggregateArrears(rows, TODAY);
    expect(result[0].term_fee).toBe(100);
    // paid = max(40, 10) = 40
    expect(result[0].paid).toBe(40);
    expect(result[0].balance).toBe(60);
  });
});
