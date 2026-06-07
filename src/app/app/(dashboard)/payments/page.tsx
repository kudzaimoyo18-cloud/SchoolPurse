import Link from "next/link";
import { Download, Receipt, ReceiptText, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireRole } from "@/lib/auth/current-user";
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
import { sanitizeOrLiteral } from "@/lib/security";
import { NewPaymentForm } from "./new-payment-form";
import { VoidPaymentButton } from "./void-payment-button";

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
  await requireRole(["platform_admin", "school_admin", "bursar"]);
  const { q, new: newFlag } = await searchParams;
  const supabase = await createClient();
  // Role check for void affordance. Voiding rewrites finance history so
  // only school_admin (and platform_admin for support) can do it; bursars
  // and teachers don't see the button.
  const currentUser = await getCurrentUser();
  const canVoid =
    currentUser.role === "school_admin" ||
    currentUser.role === "platform_admin";

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().setDate(1))
    .toISOString()
    .slice(0, 10);

  const [
    studentsRes,
    outstandingLinesRes,
    paymentsRes,
    monthRes,
    todayRes,
    classesRes,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id, first_name, last_name, classes(name)")
      .eq("status", "active")
      .order("last_name")
      .limit(2000),
    // Outstanding invoice lines so the bursar can pick what the payment is for.
    // RLS scopes both invoice_lines and invoices to this school. We filter for
    // open/partial invoices and let the form drop lines whose balance is 0.
    supabase
      .from("invoice_lines")
      .select(
        "id, description, amount_usd, paid_usd, invoices!inner(id, student_id, status, period_label, due_date)",
      )
      .in("invoices.status", ["open", "partial"]),
    (async () => {
      let query = supabase
        .from("payments")
        .select(
          "id, receipt_number, amount_usd, method, paid_at, status, payer_name_snapshot, students(first_name, last_name, classes(name))",
        )
        .order("paid_at", { ascending: false })
        .limit(200);
      if (q && q.trim()) {
        const term = sanitizeOrLiteral(q);
        if (term) {
          query = query.or(
            `receipt_number.ilike.%${term}%,payer_name_snapshot.ilike.%${term}%`,
          );
        }
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
    // Class list for the inline "Add new student" mini-form so the bursar
    // can attach the freshly-added student to a class without leaving the
    // payment flow.
    supabase
      .from("classes")
      .select("id, name, level")
      .order("name"),
  ]);

  const classes = (classesRes.data ?? []) as Array<{
    id: string;
    name: string;
    level: "primary" | "secondary" | "tertiary" | null;
  }>;

  // Group outstanding lines by student so the form can show "what is owed"
  // when a bursar picks a student. We compute balance here once and drop
  // lines that are fully paid (paid_usd >= amount_usd) — those happen briefly
  // until the trigger flips invoice.status to "paid".
  type RawLine = {
    id: string;
    description: string;
    amount_usd: number | string;
    paid_usd: number | string;
    invoices:
      | {
          id: string;
          student_id: string;
          status: string;
          period_label: string | null;
          due_date: string | null;
        }
      | Array<{
          id: string;
          student_id: string;
          status: string;
          period_label: string | null;
          due_date: string | null;
        }>
      | null;
  };
  const outstandingByStudent = new Map<
    string,
    Array<{
      id: string;
      description: string;
      balance: number;
      invoice_period: string | null;
      due_date: string | null;
    }>
  >();
  for (const raw of (outstandingLinesRes.data ?? []) as RawLine[]) {
    const inv = Array.isArray(raw.invoices) ? raw.invoices[0] : raw.invoices;
    if (!inv) continue;
    const balance = toNumber(raw.amount_usd) - toNumber(raw.paid_usd);
    if (balance <= 0.0001) continue;
    const list = outstandingByStudent.get(inv.student_id) ?? [];
    list.push({
      id: raw.id,
      description: raw.description,
      balance,
      invoice_period: inv.period_label,
      due_date: inv.due_date,
    });
    outstandingByStudent.set(inv.student_id, list);
  }
  // Sort each student's lines: oldest due first, then by description so the
  // dropdown order is stable.
  for (const lines of outstandingByStudent.values()) {
    lines.sort((a, b) => {
      const da = a.due_date ?? "9999-12-31";
      const db = b.due_date ?? "9999-12-31";
      if (da !== db) return da.localeCompare(db);
      return a.description.localeCompare(b.description);
    });
  }

  const students = (studentsRes.data ?? []).map(
    (s: Record<string, unknown>) => {
      const classesField = s.classes as
        | { name?: string }
        | { name?: string }[]
        | null;
      const className = Array.isArray(classesField)
        ? (classesField[0]?.name ?? null)
        : (classesField?.name ?? null);
      const id = s.id as string;
      return {
        id,
        name: `${s.first_name} ${s.last_name}`,
        class_name: className,
        outstanding_lines: outstandingByStudent.get(id) ?? [],
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

      <NewPaymentForm
        students={students}
        classes={classes}
        defaultOpen={newFlag === "1"}
      />

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
                        <div className="inline-flex items-center gap-3">
                          <Link
                            href={`/app/receipts/${p.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
                          >
                            <ReceiptText className="size-3.5" />
                            Receipt
                          </Link>
                          {canVoid && p.status !== "void" ? (
                            <VoidPaymentButton
                              paymentId={p.id}
                              receiptNumber={p.receipt_number}
                              amountLabel={formatMoney(p.amount_usd)}
                              studentName={s.name}
                            />
                          ) : null}
                        </div>
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
        <a
          href="/api/payments/export"
          download
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Download className="size-3.5" />
          Export CSV
        </a>
      </div>
    </div>
  );
}
