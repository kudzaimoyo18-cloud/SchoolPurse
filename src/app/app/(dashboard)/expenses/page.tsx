import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { SectionCard } from "@/components/section-card";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Donut, type DonutDatum } from "@/components/charts/donut";
import { formatDate, formatMoney, formatMoneyCompact, toNumber } from "@/lib/format";
import { NewExpenseForm } from "./new-expense-form";
import { DeleteExpenseButton } from "./delete-button";

export const metadata = { title: "Expenses — SchoolPurse" };

const CATEGORY_COLORS: Record<string, string> = {
  Payroll: "#6366f1",
  Utilities: "#f59e0b",
  Maintenance: "#ef4444",
  Supplies: "#8b5cf6",
  Operations: "#06b6d4",
  Uncategorised: "#94a8bc",
};

const FALLBACK_COLORS = [
  "#1e3a5f",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#0d9488",
];

function colorFor(name: string, index: number): string {
  return CATEGORY_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default async function ExpensesPage() {
  await requireRole(["platform_admin", "school_admin", "bursar"]);
  const supabase = await createClient();

  const monthStart = new Date(new Date().setDate(1)).toISOString().slice(0, 10);
  const prevMonthStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  const [expensesRes, categoriesRes, monthRes, prevMonthRes] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, description, payee, amount_usd, expense_date, expense_categories(name)",
      )
      .order("expense_date", { ascending: false })
      .limit(200),
    supabase.from("expense_categories").select("id, name").order("name"),
    supabase
      .from("expenses")
      .select("amount_usd, expense_categories(name)")
      .gte("expense_date", monthStart),
    supabase
      .from("expenses")
      .select("amount_usd")
      .gte("expense_date", prevMonthStart)
      .lt("expense_date", monthStart),
  ]);

  const expenses = (expensesRes.data ?? []) as Array<{
    id: string;
    description: string;
    payee: string | null;
    amount_usd: number | string;
    expense_date: string;
    expense_categories: { name?: string } | { name?: string }[] | null;
  }>;

  const categories = (categoriesRes.data ?? []) as { id: string; name: string }[];

  const monthTotal = (monthRes.data ?? []).reduce(
    (sum: number, e: Record<string, unknown>) => sum + toNumber(e.amount_usd),
    0,
  );
  const prevTotal = (prevMonthRes.data ?? []).reduce(
    (sum: number, e: Record<string, unknown>) => sum + toNumber(e.amount_usd),
    0,
  );

  const byCategory = new Map<string, number>();
  for (const e of monthRes.data ?? []) {
    const cat = (e as Record<string, unknown>).expense_categories as
      | { name?: string }
      | { name?: string }[]
      | null;
    const c = Array.isArray(cat) ? cat[0] : cat;
    const name = c?.name ?? "Uncategorised";
    byCategory.set(
      name,
      (byCategory.get(name) ?? 0) + toNumber((e as Record<string, unknown>).amount_usd),
    );
  }

  const donutData: DonutDatum[] = Array.from(byCategory.entries())
    .map(([name, value], i) => ({ name, value, color: colorFor(name, i) }))
    .sort((a, b) => b.value - a.value);

  const largestCategory = donutData[0];
  const monthDelta = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : null;

  function categoryNameOf(
    field: { name?: string } | { name?: string }[] | null,
  ): string {
    if (!field) return "Uncategorised";
    const c = Array.isArray(field) ? field[0] : field;
    return c?.name ?? "Uncategorised";
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <KpiCard
          label="Expenses this month"
          value={formatMoney(monthTotal)}
          hint={`${(monthRes.data ?? []).length} entries`}
        />
        <KpiCard
          label="Largest category"
          value={largestCategory?.name ?? "—"}
          hint={
            largestCategory ? formatMoneyCompact(largestCategory.value) : "—"
          }
        />
        <KpiCard
          label="vs Last month"
          value={
            monthDelta === null
              ? "—"
              : `${monthDelta > 0 ? "+" : ""}${monthDelta.toFixed(1)}%`
          }
          hint={`Last: ${formatMoneyCompact(prevTotal)}`}
          trend={
            monthDelta === null
              ? undefined
              : {
                  value: `${Math.abs(monthDelta).toFixed(0)}%`,
                  direction: monthDelta > 0 ? "up" : "down",
                }
          }
        />
      </div>

      <NewExpenseForm categories={categories} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <SectionCard
          title="Recent expenses"
          subtitle="Last 200 entries"
          bodyClassName="p-0"
        >
          {expenses.length === 0 ? (
            <div className="px-5 py-2">
              <EmptyState
                icon={FileText}
                title="No expenses yet"
                description="Add your first expense to start tracking outgoings."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-sp-card-alt">
                  <TableRow>
                    <TableHead className="pl-5">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="pr-5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="pl-5 text-muted-foreground">
                        {formatDate(e.expense_date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {e.description}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full bg-sp-card-alt px-2 py-0.5 text-[11px] font-medium"
                          style={{ color: colorFor(categoryNameOf(e.expense_categories), 0) }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{
                              background: colorFor(
                                categoryNameOf(e.expense_categories),
                                0,
                              ),
                            }}
                          />
                          {categoryNameOf(e.expense_categories)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.payee ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-sp-red">
                        {formatMoney(e.amount_usd)}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <DeleteExpenseButton id={e.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Breakdown" subtitle="This month, by category">
          <Donut
            data={donutData}
            centerLabel={formatMoneyCompact(monthTotal)}
            centerSubLabel="Total"
          />
          <div className="mt-4 space-y-2">
            {donutData.map((d) => {
              const pct = monthTotal > 0 ? (d.value / monthTotal) * 100 : 0;
              return (
                <div key={d.name} className="text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-sm"
                        style={{ background: d.color }}
                      />
                      <span className="font-medium">{d.name}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoneyCompact(d.value)}{" "}
                      <span className="text-[10px]">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-sp-card-alt">
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, background: d.color }}
                    />
                  </div>
                </div>
              );
            })}
            {donutData.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No expenses this month yet.
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
