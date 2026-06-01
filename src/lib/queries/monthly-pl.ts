import { format, parseISO, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format";

export interface MonthlyPL {
  key: string; // YYYY-MM
  label: string; // e.g. "Apr 2026"
  shortLabel: string; // e.g. "Apr"
  income: number;
  expenses: number;
  net: number;
  margin: number; // percentage 0..100 (or negative)
}

export interface YearToDateTotals {
  income: number;
  expenses: number;
  net: number;
  margin: number;
}

// Row shapes from the Supabase selects used below. Exported so tests and
// any future caller can build fixtures without going through Supabase.
export interface MonthlyPLPaymentRow {
  amount_usd: number | string;
  paid_at: string;
}

export interface MonthlyPLExpenseRow {
  amount_usd: number | string;
  expense_date: string;
}

export interface YearToDateAmountRow {
  amount_usd?: number | string | null;
}

/**
 * Pure aggregation of payment + expense rows into the trailing N-month P&L.
 *
 * Always returns `months` buckets in ascending chronological order, even if
 * a bucket has zero activity (so charts don't have gaps). Rows outside the
 * window are silently ignored. Margin is income-based: 0% when income is 0,
 * even if expenses exist.
 *
 * `now` controls the window end; pass it explicitly for deterministic tests.
 */
export function aggregateMonthlyPL(
  payments: MonthlyPLPaymentRow[],
  expenses: MonthlyPLExpenseRow[],
  now: Date = new Date(),
  months = 6,
): MonthlyPL[] {
  const buckets = new Map<
    string,
    { income: number; expenses: number; date: Date }
  >();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const key = format(d, "yyyy-MM");
    buckets.set(key, { income: 0, expenses: 0, date: d });
  }

  for (const p of payments) {
    const key = format(parseISO(p.paid_at), "yyyy-MM");
    const b = buckets.get(key);
    if (b) b.income += toNumber(p.amount_usd);
  }

  for (const e of expenses) {
    const key = format(parseISO(e.expense_date), "yyyy-MM");
    const b = buckets.get(key);
    if (b) b.expenses += toNumber(e.amount_usd);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, b]) => {
      const net = b.income - b.expenses;
      const margin = b.income > 0 ? (net / b.income) * 100 : 0;
      return {
        key,
        label: format(b.date, "MMM yyyy"),
        shortLabel: format(b.date, "MMM"),
        income: b.income,
        expenses: b.expenses,
        net,
        margin,
      };
    });
}

/**
 * Pure year-to-date totals from raw payment + expense amount rows.
 * Caller is responsible for filtering rows to the current year before passing.
 */
export function aggregateYearToDate(
  payments: YearToDateAmountRow[],
  expenses: YearToDateAmountRow[],
): YearToDateTotals {
  const income = payments.reduce((s, p) => s + toNumber(p.amount_usd), 0);
  const exp = expenses.reduce((s, e) => s + toNumber(e.amount_usd), 0);
  const net = income - exp;
  return {
    income,
    expenses: exp,
    net,
    margin: income > 0 ? (net / income) * 100 : 0,
  };
}

/**
 * Fetch monthly P&L for the trailing N months including the current month.
 */
export async function fetchMonthlyPL(months = 6): Promise<MonthlyPL[]> {
  const supabase = await createClient();

  const now = new Date();
  const from = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - (months - 1), 1),
  );
  const fromIso = from.toISOString();

  const [paymentsRes, expensesRes] = await Promise.all([
    supabase
      .from("payments")
      .select("amount_usd, paid_at")
      .gte("paid_at", fromIso)
      .eq("status", "completed")
      .limit(50000),
    supabase
      .from("expenses")
      .select("amount_usd, expense_date")
      .gte("expense_date", fromIso.slice(0, 10))
      .limit(50000),
  ]);

  return aggregateMonthlyPL(
    (paymentsRes.data ?? []) as MonthlyPLPaymentRow[],
    (expensesRes.data ?? []) as MonthlyPLExpenseRow[],
    now,
    months,
  );
}

export async function fetchYearToDate(): Promise<YearToDateTotals> {
  const supabase = await createClient();
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
    .toISOString()
    .slice(0, 10);
  const [payments, expenses] = await Promise.all([
    supabase
      .from("payments")
      .select("amount_usd")
      .gte("paid_at", yearStart)
      .eq("status", "completed"),
    supabase
      .from("expenses")
      .select("amount_usd")
      .gte("expense_date", yearStart),
  ]);

  return aggregateYearToDate(
    (payments.data ?? []) as YearToDateAmountRow[],
    (expenses.data ?? []) as YearToDateAmountRow[],
  );
}
