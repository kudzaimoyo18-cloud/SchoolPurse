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

  const buckets = new Map<
    string,
    { income: number; expenses: number; date: Date }
  >();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const key = format(d, "yyyy-MM");
    buckets.set(key, { income: 0, expenses: 0, date: d });
  }

  for (const p of paymentsRes.data ?? []) {
    const r = p as { amount_usd: number | string; paid_at: string };
    const key = format(parseISO(r.paid_at), "yyyy-MM");
    const b = buckets.get(key);
    if (b) b.income += toNumber(r.amount_usd);
  }

  for (const e of expensesRes.data ?? []) {
    const r = e as { amount_usd: number | string; expense_date: string };
    const key = format(parseISO(r.expense_date), "yyyy-MM");
    const b = buckets.get(key);
    if (b) b.expenses += toNumber(r.amount_usd);
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

export async function fetchYearToDate(): Promise<{
  income: number;
  expenses: number;
  net: number;
  margin: number;
}> {
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
    supabase.from("expenses").select("amount_usd").gte("expense_date", yearStart),
  ]);
  const income = (payments.data ?? []).reduce(
    (s: number, p: Record<string, unknown>) => s + toNumber(p.amount_usd),
    0,
  );
  const exp = (expenses.data ?? []).reduce(
    (s: number, e: Record<string, unknown>) => s + toNumber(e.amount_usd),
    0,
  );
  const net = income - exp;
  return {
    income,
    expenses: exp,
    net,
    margin: income > 0 ? (net / income) * 100 : 0,
  };
}
