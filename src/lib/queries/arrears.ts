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

/**
 * Fetch all open/partial invoices with their lines and aggregate to a per-student
 * arrears view. Returns the heaviest balances first.
 */
export async function fetchArrears(): Promise<ArrearsStudent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, student_id, total_usd, due_date, status, students(first_name, last_name, classes(name)), invoice_lines(amount_usd, paid_usd, payment_allocations(amount_usd, payments(status)))",
    )
    .in("status", ["open", "partial"])
    .limit(5000);

  if (error || !data) return [];

  const byStudent = new Map<string, ArrearsStudent>();
  const today = new Date();

  for (const row of data as Array<Record<string, unknown>>) {
    const studentField = row.students as
      | { first_name?: string; last_name?: string; classes?: unknown }
      | Array<{ first_name?: string; last_name?: string; classes?: unknown }>
      | null;
    const s = Array.isArray(studentField) ? studentField[0] : studentField;
    if (!s) continue;

    const classField = s.classes as
      | { name?: string }
      | { name?: string }[]
      | undefined;
    const className = Array.isArray(classField)
      ? (classField[0]?.name ?? null)
      : (classField?.name ?? null);

    type AllocRow = {
      amount_usd?: number | string;
      payments?:
        | { status?: string }
        | Array<{ status?: string }>
        | null;
    };
    type LineRow = {
      amount_usd?: number | string;
      paid_usd?: number | string;
      payment_allocations?: AllocRow[] | null;
    };

    const lines = (row.invoice_lines as LineRow[] | null) ?? [];

    const lineTotal = lines.reduce(
      (sum, ln) => sum + toNumber(ln.amount_usd),
      0,
    );
    const total = lineTotal > 0 ? lineTotal : toNumber(row.total_usd);

    // Sum: the materialized paid_usd column (in case it ever gets set)
    // PLUS the sum of allocations from completed (non-void) payments.
    // This handles the current DB where allocate_payment_to_invoice creates
    // payment_allocations rows but doesn't bump invoice_lines.paid_usd.
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

    const studentId = row.student_id as string;
    const existing = byStudent.get(studentId);
    if (existing) {
      existing.term_fee += total;
      existing.paid += paid;
      existing.balance += balance;
      existing.days_overdue = Math.max(existing.days_overdue, overdue);
      existing.invoice_ids.push(row.id as string);
    } else {
      byStudent.set(studentId, {
        student_id: studentId,
        student_name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
        class_name: className,
        term_fee: total,
        paid,
        balance,
        days_overdue: overdue,
        invoice_ids: [row.id as string],
      });
    }
  }

  return Array.from(byStudent.values()).sort((a, b) => b.balance - a.balance);
}
