import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  DollarSign,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionCard } from "@/components/section-card";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import { ArrearsStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Donut, type DonutDatum } from "@/components/charts/donut";
import { IncomeVsExpenseChart } from "@/components/charts/income-vs-expense";
import { formatDate, formatMoney, formatMoneyCompact, toNumber } from "@/lib/format";
import { fetchArrears } from "@/lib/queries/arrears";
import { fetchMonthlyPL } from "@/lib/queries/monthly-pl";

export const metadata = { title: "Overview — SchoolPurse" };

const CATEGORY_COLORS: Record<string, string> = {
  Payroll: "#6366f1",
  Utilities: "#f59e0b",
  Maintenance: "#ef4444",
  Supplies: "#8b5cf6",
  Operations: "#06b6d4",
  Uncategorised: "#94a8bc",
};

const FALLBACK_COLORS = [
  "#22c27a",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default async function OverviewPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().setDate(1)).toISOString().slice(0, 10);
  const prevMonthStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  const [
    todayRes,
    monthIncomeRes,
    prevMonthIncomeRes,
    monthExpensesRes,
    arrears,
    monthly,
    recentPaymentsRes,
    termRes,
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount_usd")
      .gte("paid_at", today)
      .eq("status", "completed"),
    supabase
      .from("payments")
      .select("amount_usd")
      .gte("paid_at", monthStart)
      .eq("status", "completed"),
    supabase
      .from("payments")
      .select("amount_usd")
      .gte("paid_at", prevMonthStart)
      .lt("paid_at", monthStart)
      .eq("status", "completed"),
    supabase
      .from("expenses")
      .select("amount_usd, expense_categories(name)")
      .gte("expense_date", monthStart),
    fetchArrears(),
    fetchMonthlyPL(6),
    supabase
      .from("payments")
      .select(
        "id, receipt_number, amount_usd, paid_at, students(first_name, last_name, classes(name))",
      )
      .eq("status", "completed")
      .order("paid_at", { ascending: false })
      .limit(6),
    supabase
      .from("terms")
      .select("name, start_date, end_date")
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  const todayTotal = (todayRes.data ?? []).reduce(
    (s: number, p: Record<string, unknown>) => s + toNumber(p.amount_usd),
    0,
  );
  const monthIncome = (monthIncomeRes.data ?? []).reduce(
    (s: number, p: Record<string, unknown>) => s + toNumber(p.amount_usd),
    0,
  );
  const prevMonthIncome = (prevMonthIncomeRes.data ?? []).reduce(
    (s: number, p: Record<string, unknown>) => s + toNumber(p.amount_usd),
    0,
  );
  const monthExpenses = (monthExpensesRes.data ?? []).reduce(
    (s: number, e: Record<string, unknown>) => s + toNumber(e.amount_usd),
    0,
  );
  const net = monthIncome - monthExpenses;

  const outstanding = arrears.reduce((s, a) => s + a.balance, 0);

  // Today's trend vs avg daily of last 7 days
  const monthTrend =
    prevMonthIncome > 0
      ? ((monthIncome - prevMonthIncome) / prevMonthIncome) * 100
      : null;

  // Term collection
  const term = termRes.data as
    | { name: string; start_date: string; end_date: string }
    | null;
  let termTarget = 0;
  let termCollected = 0;
  if (term) {
    const termIdRes = await supabase
      .from("terms")
      .select("id")
      .eq("is_current", true)
      .maybeSingle();
    const termId = (termIdRes.data as { id: string } | null)?.id ?? "";
    const { data: termInvoices } = await supabase
      .from("invoices")
      .select(
        "total_usd, invoice_lines(amount_usd, paid_usd, payment_allocations(amount_usd, payments(status)))",
      )
      .eq("term_id", termId);
    type AllocRow = {
      amount_usd: number | string;
      payments?: { status?: string } | Array<{ status?: string }> | null;
    };
    type LineRow = {
      amount_usd?: number | string;
      paid_usd: number | string;
      payment_allocations?: AllocRow[] | null;
    };
    const list = (termInvoices ?? []) as Array<{
      total_usd: number | string;
      invoice_lines: LineRow[] | null;
    }>;
    for (const inv of list) {
      termTarget += toNumber(inv.total_usd);
      termCollected += (inv.invoice_lines ?? []).reduce((s, ln) => {
        const baseline = toNumber(ln.paid_usd);
        const allocs = ln.payment_allocations ?? [];
        const fromAllocs = allocs.reduce((a, alloc) => {
          const pay = Array.isArray(alloc.payments)
            ? alloc.payments[0]
            : alloc.payments;
          if (pay && pay.status === "void") return a;
          return a + toNumber(alloc.amount_usd);
        }, 0);
        return s + Math.max(baseline, fromAllocs);
      }, 0);
    }
  }
  const termPct = termTarget > 0 ? (termCollected / termTarget) * 100 : 0;
  const termOutstanding = Math.max(termTarget - termCollected, 0);

  // Expense donut
  const byCategory = new Map<string, number>();
  for (const e of monthExpensesRes.data ?? []) {
    const cat = (e as Record<string, unknown>).expense_categories as
      | { name?: string }
      | { name?: string }[]
      | null;
    const c = Array.isArray(cat) ? cat[0] : cat;
    const name = c?.name ?? "Uncategorised";
    byCategory.set(
      name,
      (byCategory.get(name) ?? 0) +
        toNumber((e as Record<string, unknown>).amount_usd),
    );
  }
  const donutData: DonutDatum[] = Array.from(byCategory.entries())
    .map(([name, value], i) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const chartData = monthly.map((m) => ({
    month: m.shortLabel,
    income: m.income,
    expenses: m.expenses,
  }));

  const recentPayments = (recentPaymentsRes.data ?? []) as Array<{
    id: string;
    receipt_number: string;
    amount_usd: number | string;
    paid_at: string;
    students:
      | {
          first_name: string;
          last_name: string;
          classes: { name?: string } | { name?: string }[] | null;
        }
      | Array<{
          first_name: string;
          last_name: string;
          classes: { name?: string } | { name?: string }[] | null;
        }>
      | null;
  }>;

  const topArrears = arrears.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's collections"
          value={formatMoney(todayTotal)}
          hint={formatDate(today)}
          icon={CreditCard}
        />
        <KpiCard
          label="This month — income"
          value={formatMoney(monthIncome)}
          hint={`vs last: ${formatMoneyCompact(prevMonthIncome)}`}
          trend={
            monthTrend === null
              ? undefined
              : {
                  value: `${Math.abs(monthTrend).toFixed(0)}%`,
                  direction: monthTrend >= 0 ? "up" : "down",
                }
          }
          icon={DollarSign}
        />
        <KpiCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          hint={`${arrears.length} student${arrears.length === 1 ? "" : "s"} in arrears`}
          variant={outstanding > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Net (this month)"
          value={formatMoney(net)}
          hint="income − expenses"
          icon={net >= 0 ? TrendingUp : TrendingDown}
          variant={net < 0 ? "danger" : "default"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <SectionCard
          title="Income vs Expenses"
          subtitle="Last 6 months"
        >
          <IncomeVsExpenseChart data={chartData} />
        </SectionCard>

        <SectionCard
          title="Expense breakdown"
          subtitle="This month"
        >
          <Donut
            data={donutData}
            centerLabel={formatMoneyCompact(monthExpenses)}
            centerSubLabel="Total"
          />
          <div className="mt-4 space-y-1.5 text-xs">
            {donutData.map((d) => {
              const pct =
                monthExpenses > 0 ? (d.value / monthExpenses) * 100 : 0;
              return (
                <div
                  key={d.name}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-sm"
                      style={{ background: d.color }}
                    />
                    <span className="font-medium">{d.name}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            {donutData.length === 0 ? (
              <p className="text-muted-foreground">No expenses yet this month.</p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      {/* Fee collection rate */}
      {term ? (
        <SectionCard
          title="Fee collection rate"
          subtitle={`${term.name}`}
        >
          <div className="space-y-2">
            <div className="h-3 overflow-hidden rounded-full bg-sp-card-alt">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(termPct, 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Term target
                </span>
                <p className="text-sm font-semibold">{formatMoney(termTarget)}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Collected
                </span>
                <p className="text-sm font-semibold text-primary">
                  {formatMoney(termCollected)}
                </p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Outstanding
                </span>
                <p className="text-sm font-semibold text-sp-red">
                  {formatMoney(termOutstanding)}
                </p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  % collected
                </span>
                <p className="text-sm font-semibold">{termPct.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <SectionCard
          title="Top arrears"
          subtitle="Largest outstanding balances"
          action={
            arrears.length > 5 ? (
              <Link
                href="/arrears"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
              >
                View all {arrears.length}
                <ArrowRight className="size-3" />
              </Link>
            ) : null
          }
          bodyClassName="p-0"
        >
          {topArrears.length === 0 ? (
            <div className="px-5 py-2">
              <EmptyState
                title="Everyone is paid up"
                description="No outstanding balances right now."
              />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-sp-card-alt">
                <TableRow>
                  <TableHead className="pl-5">Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topArrears.map((a) => (
                  <TableRow key={a.student_id}>
                    <TableCell className="pl-5 font-medium">
                      {a.student_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.class_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sp-red">
                      {formatMoney(a.balance)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <ArrearsStatusBadge daysOverdue={a.days_overdue} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard
          title="Recent payments"
          subtitle="Latest receipts"
          bodyClassName="p-0"
        >
          {recentPayments.length === 0 ? (
            <div className="px-5 py-2">
              <EmptyState
                icon={Receipt}
                title="No payments yet"
                description="Record a payment to see it here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentPayments.map((p) => {
                const sField = p.students;
                const s = Array.isArray(sField) ? sField[0] : sField;
                const cField = s?.classes as
                  | { name?: string }
                  | { name?: string }[]
                  | null;
                const className = Array.isArray(cField)
                  ? cField?.[0]?.name
                  : cField?.name;
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {s ? `${s.first_name} ${s.last_name}` : "Unknown"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {className ?? "—"} · {p.receipt_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-primary">
                        +{formatMoney(p.amount_usd)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(p.paid_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
