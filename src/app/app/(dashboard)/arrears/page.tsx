import Link from "next/link";
import { AlertTriangle, Download, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { fetchArrears } from "@/lib/queries/arrears";
import { requireRole } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { normalizePlan } from "@/lib/plan";
import { RemindersButton } from "./reminders-button";

export const metadata = { title: "Arrears — SchoolPurse" };

export default async function ArrearsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole(["platform_admin", "school_admin", "bursar"]);
  const { q } = await searchParams;
  const all = await fetchArrears();

  // WhatsApp reminders are an AI-plan feature.
  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("plan")
    .eq("id", user.schoolId ?? "")
    .maybeSingle();
  const isAiPlan = normalizePlan((school as { plan?: string } | null)?.plan) === "ai";

  const term = (q ?? "").trim().toLowerCase();
  const filtered = term
    ? all.filter(
        (a) =>
          a.student_name.toLowerCase().includes(term) ||
          (a.class_name ?? "").toLowerCase().includes(term),
      )
    : all;

  const totalOutstanding = all.reduce((sum, a) => sum + a.balance, 0);
  const critical = all.filter((a) => a.days_overdue > 60);
  const moderate = all.filter(
    (a) => a.days_overdue > 30 && a.days_overdue <= 60,
  );
  const avgDays =
    all.length > 0
      ? Math.round(all.reduce((s, a) => s + a.days_overdue, 0) / all.length)
      : 0;

  const byClass = new Map<
    string,
    { count: number; balance: number; paid: number; total: number }
  >();
  for (const a of all) {
    const key = a.class_name ?? "Unassigned";
    const existing = byClass.get(key) ?? {
      count: 0,
      balance: 0,
      paid: 0,
      total: 0,
    };
    existing.count += 1;
    existing.balance += a.balance;
    existing.paid += a.paid;
    existing.total += a.term_fee;
    byClass.set(key, existing);
  }
  const classRows = Array.from(byClass.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total outstanding"
          value={formatMoney(totalOutstanding)}
          hint={`${all.length} student${all.length === 1 ? "" : "s"}`}
          variant={totalOutstanding > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Critical (>60d)"
          value={String(critical.length)}
          hint={formatMoneyCompact(
            critical.reduce((s, a) => s + a.balance, 0),
          )}
          variant="danger"
        />
        <KpiCard
          label="Moderate (30–60d)"
          value={String(moderate.length)}
          hint={formatMoneyCompact(
            moderate.reduce((s, a) => s + a.balance, 0),
          )}
        />
        <KpiCard
          label="Avg days overdue"
          value={String(avgDays)}
          hint="across all open balances"
        />
      </div>

      {classRows.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {classRows.map(([name, c]) => {
            const pct =
              c.total > 0 ? Math.min(100, (c.paid / c.total) * 100) : 0;
            return (
              <div
                key={name}
                className="rounded-lg border border-border bg-card p-3"
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  {name}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-sp-red">
                  {formatMoney(c.balance)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {c.count} owing
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sp-card-alt">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {pct.toFixed(0)}% collected
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      <SectionCard
        title="Students in arrears"
        subtitle={`${all.length} student${all.length === 1 ? "" : "s"} with outstanding balance.`}
        action={
          <div className="flex items-center gap-2">
            <form action="" className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Name or class"
                className="h-9 w-48 pl-9"
              />
            </form>
            <a
              href="/api/arrears/export"
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Download className="size-3.5" />
              Export CSV
            </a>
            {isAiPlan && all.length > 0 ? <RemindersButton /> : null}
          </div>
        }
        bodyClassName="p-0"
      >
        {filtered.length === 0 ? (
          <div className="px-5 py-2">
            <EmptyState
              icon={AlertTriangle}
              title={
                all.length === 0 ? "No arrears" : "No matches"
              }
              description={
                all.length === 0
                  ? "Everyone is paid up. Nice work."
                  : "Try a different search term."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sp-card-alt">
                <TableRow>
                  <TableHead className="pl-5">Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Term fee</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Days overdue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.student_id}>
                    <TableCell className="pl-5 font-medium">
                      {a.student_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.class_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(a.term_fee)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMoney(a.paid)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sp-red">
                      {formatMoney(a.balance)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {a.days_overdue}
                    </TableCell>
                    <TableCell>
                      <ArrearsStatusBadge daysOverdue={a.days_overdue} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Link
                        href="/app/payments?new=1"
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Record payment
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
