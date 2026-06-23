import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toNumber, daysBetween } from "@/lib/format";

export interface ArrearsStudent {
  student_id: string;
  student_name: string;
  class_name: string | null;
  term_fee: number;
  paid: number;
  balance: number;
  days_overdue: number;
  invoice_ids: string[];
}

// ── Row shapes ─────────────────────────────────────────────────────────────
// These mirror what Supabase returns for the nested select used by
// `fetchArrears`. Exported so tests and other callers can build fixtures
// without going through Supabase.

export type ArrearsPaymentRef =
  | { status?: string }
  | Array<{ status?: string }>
  | null;

export type ArrearsAllocationRow = {
  amount_usd?: number | string;
  payments?: ArrearsPaymentRef;
};

export type ArrearsLineRow = {
  amount_usd?: number | string;
  paid_usd?: number | string;
  payment_allocations?: ArrearsAllocationRow[] | null;
};

export type ArrearsClassField =
  | { name?: string }
  | Array<{ name?: string }>
  | null
  | undefined;

export type ArrearsStudentField =
  | {
      first_name?: string;
      last_name?: string;
      classes?: ArrearsClassField;
    }
  | Array<{
      first_name?: string;
      last_name?: string;
      classes?: ArrearsClassField;
    }>
  | null;

export interface ArrearsInvoiceRow {
  id: string;
  student_id: string;
  total_usd: number | string;
  due_date: string | null;
  status?: string;
  students?: ArrearsStudentField;
  invoice_lines?: ArrearsLineRow[] | null;
}

/**
 * Pure aggregation of raw invoice rows into per-student arrears.
 *
 * Accepts `today` so callers (and tests) control time deterministically.
 * Behavior contract:
 *   - Term fee per invoice = sum of line.amount_usd, falling back to
 *     invoice.total_usd if no lines are present.
 *   - Paid per invoice = sum over lines of MAX(line.paid_usd, sum of
 *     non-void payment_allocations). Belt-and-braces because the current
 *     write path populates allocations but not always invoice_lines.paid_usd.
 *   - Void allocations are excluded.
 *   - Invoices with balance ≤ $0.0001 are dropped (covers float dust).
 *   - Multiple invoices per student roll up; days_overdue is the max
 *     across that student's open invoices.
 *   - Output sorted by balance DESC (heaviest first).
 */
export function aggregateArrears(
  rows: ArrearsInvoiceRow[],
  today: Date = new Date(),
): ArrearsStudent[] {
  const byStudent = new Map<string, ArrearsStudent>();

  for (const row of rows) {
    const studentField = row.students;
    const s = Array.isArray(studentField) ? studentField[0] : studentField;
    if (!s) continue;

    const classField = s.classes;
    const className = Array.isArray(classField)
      ? (classField[0]?.name ?? null)
      : (classField?.name ?? null);

    const lines = row.invoice_lines ?? [];

    const lineTotal = lines.reduce(
      (sum, ln) => sum + toNumber(ln.amount_usd),
      0,
    );
    const total = lineTotal > 0 ? lineTotal : toNumber(row.total_usd);

    const paid = lines.reduce((sum, ln) => {
      const baseline = toNumber(ln.paid_usd);
      const allocs = ln.payment_allocations ?? [];
      const fromAllocs = allocs.reduce((a, alloc) => {
        const pay = Array.isArray(alloc.payments)
          ? alloc.payments[0]
          : alloc.payments;
        if (pay && pay.status === "void") return a;
        return a + toNumber(alloc.amount_usd);
      }, 0);
      return sum + Math.max(baseline, fromAllocs);
    }, 0);
    const balance = Math.max(total - paid, 0);
    if (balance <= 0.0001) continue;

    const dueDate = row.due_date ? String(row.due_date) : null;
    const overdue = dueDate ? Math.max(daysBetween(dueDate, today), 0) : 0;

    const studentId = row.student_id;
    const existing = byStudent.get(studentId);
    if (existing) {
      existing.term_fee += total;
      existing.paid += paid;
      existing.balance += balance;
      existing.days_overdue = Math.max(existing.days_overdue, overdue);
      existing.invoice_ids.push(row.id);
    } else {
      byStudent.set(studentId, {
        student_id: studentId,
        student_name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
        class_name: className,
        term_fee: total,
        paid,
        balance,
        days_overdue: overdue,
        invoice_ids: [row.id],
      });
    }
  }

  return Array.from(byStudent.values()).sort((a, b) => b.balance - a.balance);
}

/**
 * Fetch all open/partial invoices with their lines and aggregate to a per-student
 * arrears view. Returns the heaviest balances first.
 *
 * Wrapped in React `cache()` so the heavy nested query runs at most once per
 * server request — the dashboard layout and the overview page both call this
 * during the same render, and without caching that fired the query twice.
 */
export const fetchArrears = cache(async (): Promise<ArrearsStudent[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, student_id, total_usd, due_date, status, students(first_name, last_name, classes(name)), invoice_lines(amount_usd, paid_usd, payment_allocations(amount_usd, payments(status)))",
    )
    .in("status", ["open", "partial"])
    .limit(5000);

  if (error || !data) return [];

  return aggregateArrears(data as unknown as ArrearsInvoiceRow[], new Date());
});
