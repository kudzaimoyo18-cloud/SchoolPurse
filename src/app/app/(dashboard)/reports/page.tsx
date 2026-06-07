import { Download } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { KpiCard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncomeVsExpenseChart } from "@/components/charts/income-vs-expense";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { fetchMonthlyPL, fetchYearToDate } from "@/lib/queries/monthly-pl";
import { requireRole } from "@/lib/auth/current-user";

export const metadata = { title: "Reports & P&L — SchoolPurse" };

export default async function ReportsPage() {
  await requireRole(["platform_admin", "school_admin", "bursar"]);
  const [monthly12, ytd] = await Promise.all([
    fetchMonthlyPL(12),
    fetchYearToDate(),
  ]);

  const reverse = [...monthly12].reverse();

  const chartData = monthly12.map((m) => ({
    month: m.shortLabel,
    income: m.income,
    expenses: m.expenses,
  }));

  const avgMargin =
    monthly12.filter((m) => m.income > 0).length > 0
      ? monthly12
          .filter((m) => m.income > 0)
          .reduce((s, m) => s + m.margin, 0) /
        monthly12.filter((m) => m.income > 0).length
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="YTD income"
          value={formatMoney(ytd.income)}
          hint={`${new Date().getFullYear()} year to date`}
        />
        <KpiCard
          label="YTD expenses"
          value={formatMoney(ytd.expenses)}
          hint="all categories"
        />
        <KpiCard
          label="Net surplus"
          value={formatMoney(ytd.net)}
          hint="income − expenses"
          variant={ytd.net < 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Avg net margin"
          value={`${avgMargin.toFixed(1)}%`}
          hint="12-month average"
        />
      </div>

      <SectionCard
        title="Income vs Expenses"
        subtitle="Trailing 12 months"
      >
        <IncomeVsExpenseChart data={chartData} />
      </SectionCard>

      <SectionCard
        title="Monthly P&L summary"
        subtitle="Newest first"
        action={
          <a
            href="/api/reports/export"
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Download className="size-3.5" />
            Export CSV
          </a>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-sp-card-alt">
              <TableRow>
                <TableHead className="pl-5">Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="pr-5">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reverse.map((m) => {
                const margin = m.margin;
                const w = Math.min(Math.max(margin, 0), 100);
                return (
                  <TableRow key={m.key}>
                    <TableCell className="pl-5 font-medium">{m.label}</TableCell>
                    <TableCell className="text-right tabular-nums text-primary">
                      {formatMoneyCompact(m.income)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sp-red">
                      {formatMoneyCompact(m.expenses)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${m.net < 0 ? "text-sp-red" : "text-foreground"}`}
                    >
                      {formatMoneyCompact(m.net)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sp-card-alt">
                          <div
                            className={`h-full ${margin < 0 ? "bg-sp-red" : "bg-primary"}`}
                            style={{ width: `${w}%` }}
                          />
                        </div>
                        <span
                          className={`min-w-[3rem] text-right text-xs tabular-nums ${margin < 0 ? "text-sp-red" : "text-muted-foreground"}`}
                        >
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
