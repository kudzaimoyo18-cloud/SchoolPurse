import Link from "next/link";
import { Download, Receipt, ReceiptText, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatDate, formatDateTime, formatMoney, toNumber } from "@/lib/format";
import { NewPaymentForm } from "./new-payment-form";

export const metadata = { title: "Payments — SchoolPurse" };

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; new?: string }>;
}) {
  const { q, new: newFlag } = await searchParams;
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().setDate(1))
    .toISOString()
    .slice(0, 10);

  const [
    studentsRes,
    paymentsRes,
    monthRes,
    todayRes,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id, first_name, last_name, classes(name)")
      .eq("status", "active")
      .order("last_name")
      .limit(2000),
    (async () => {
      let query = supabase
        .from("payments")
        .select(
          "id, receipt_number, amount_usd, method, paid_at, status, payer_name_snapshot, students(first_name, last_name, classes(name))",
        )
        .order("paid_at", { ascending: false })
        .limit(200);
      if (q && q.trim()) {
        const term = q.trim();
        query = query.or(
          `receipt_number.ilike.%${term}%,payer_name_snapshot.ilike.%${term}%`,
        );
      }
      return query;
    })(),
    supabase
      .from("payments")
      .select("amount_usd")
      .gte("paid_at", monthStart)
      .eq("status", "completed"),
    supabase
      .from("payments")
      .select("amount_usd")
      .gte("paid_at", today)
      .eq("status", "completed"),
  ]);

  const students = (studentsRes.data ?? []).map(
    (s: Record<string, unknown>) => {
      const classesField = s.classes as
        | { name?: string }
        | { name?: string }[]
        | null;
      const className = Array.isArray(classesField)
        ? (classesField[0]?.name ?? null)
        : (classesField?.name ?? null);
      return {
        id: s.id as string,
        name: `${s.first_name} ${s.last_name}`,
        class_name: className,
      };
    },
  );

  const payments = (paymentsRes.data ?? []) as Array<{
    id: string;
    receipt_number: string;
    amount_usd: number | string;
    method: string;
    paid_at: string;
    status: string;
    payer_name_snapshot: string | null;
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

  const monthTotal = (monthRes.data ?? []).reduce(
    (sum: number, p: Record<string, unknown>) => sum + toNumber(p.amount_usd),
    0,
  );
  const todayTotal = (todayRes.data ?? []).reduce(
    (sum: number, p: Record<string, unknown>) => sum + toNumber(p.amount_usd),
    0,
  );
  const monthCount = (monthRes.data ?? []).length;
  const avgPayment = monthCount > 0 ? monthTotal / monthCount : 0;

  function studentName(
    p: (typeof payments)[number],
  ): { name: string; className: string | null } {
    const raw = p.students;
    if (!raw) return { name: "Unknown", className: null };
    const r = Array.isArray(raw) ? raw[0] : raw;
    if (!r) return { name: "Unknown", className: null };
    const className = Array.isArray(r.classes)
      ? (r.classes[0]?.name ?? null)
      : (r.classes?.name ?? null);
    return {
      name: `${r.first_name} ${r.last_name}`,
      className: className ?? null,
    };
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <KpiCard
          label="This month"
          value={formatMoney(monthTotal)}
          hint={`${monthCount} payment${monthCount === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Today"
          value={formatMoney(todayTotal)}
          hint={formatDate(today)}
        />
        <KpiCard
          label="Avg payment (month)"
          value={formatMoney(avgPayment)}
          hint="per receipt"
        />
      </div>

      <NewPaymentForm students={students} defaultOpen={newFlag === "1"} />

      <SectionCard
        title="Recent payments"
        subtitle="Last 200 payments, newest first."
        action={
          <form action="" className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Receipt # or payer"
              className="h-9 pl-9"
            />
          </form>
        }
        bodyClassName="p-0"
      >
        {payments.length === 0 ? (
          <div className="px-5 py-2">
            <EmptyState
              icon={Receipt}
              title="No payments yet"
              description="Record your first payment using the form above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sp-card-alt">
                <TableRow>
                  <TableHead className="pl-5">Receipt</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const s = studentName(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="pl-5 font-mono text-xs font-medium">
                        {p.receipt_number}
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.className ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${p.status === "void" ? "text-muted-foreground line-through" : "text-primary"}`}
                      >
                        {formatMoney(p.amount_usd)}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        title={formatDateTime(p.paid_at)}
                      >
                        {formatDate(p.paid_at)}
                      </TableCell>
                      <TableCell>
                        {p.status === "void" ? (
                          <StatusBadge label="Void" variant="danger" />
                        ) : (
                          <StatusBadge label="Completed" variant="success" />
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Link
                          href={`/receipts/${p.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
                        >
                          <ReceiptText className="size-3.5" />
                          Receipt
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <Link
          href="/api/payments/export"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Download className="size-3.5" />
          Export CSV
        </Link>
      </div>
    </div>
  );
}
