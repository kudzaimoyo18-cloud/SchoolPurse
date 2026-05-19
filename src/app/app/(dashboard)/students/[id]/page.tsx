import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStudentPhotoUrl } from "@/lib/storage";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
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
import { StudentPhotoUpload } from "./photo-upload";

export const metadata = { title: "Student — SchoolPurse" };

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [studentRes, termRes] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, first_name, last_name, dob, gender, enrollment_date, status, photo_path, class_id, classes(name)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("terms")
      .select("id, name, start_date, end_date")
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  if (!studentRes.data) notFound();

  const student = studentRes.data as Record<string, unknown>;
  const term = termRes.data as
    | { id: string; name: string; start_date: string; end_date: string }
    | null;

  const classField = student.classes as
    | { name?: string }
    | { name?: string }[]
    | null;
  const className = Array.isArray(classField)
    ? (classField[0]?.name ?? null)
    : (classField?.name ?? null);

  const firstName = String(student.first_name);
  const lastName = String(student.last_name);
  const fullName = `${firstName} ${lastName}`;
  const initials = getInitials(firstName, lastName);
  const photoUrl = await getStudentPhotoUrl(
    (student.photo_path as string | null) ?? null,
  );

  // Pull payments + outstanding lines + term invoices in parallel. We do
  // these AFTER the student fetch so we can 404 cleanly above.
  const [paymentsRes, openLinesRes, termInvoicesRes] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, receipt_number, amount_usd, method, paid_at, status, payer_name_snapshot, payment_allocations(amount_usd, invoice_lines(description, invoices(period_label)))",
      )
      .eq("student_id", id)
      .order("paid_at", { ascending: false })
      .limit(200),
    supabase
      .from("invoice_lines")
      .select(
        "id, description, amount_usd, paid_usd, invoices!inner(id, student_id, status, period_label, due_date)",
      )
      .eq("invoices.student_id", id)
      .in("invoices.status", ["open", "partial"]),
    term?.id
      ? supabase
          .from("invoices")
          .select(
            "id, total_usd, status, invoice_lines(amount_usd, paid_usd)",
          )
          .eq("student_id", id)
          .eq("term_id", term.id)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  // === Term summary ====================================================
  type TermLine = { amount_usd: number | string; paid_usd: number | string };
  type TermInvoice = {
    total_usd: number | string;
    invoice_lines: TermLine[] | null;
  };
  const termInvoices = (termInvoicesRes.data ?? []) as TermInvoice[];
  let termBilled = 0;
  let termPaid = 0;
  for (const inv of termInvoices) {
    const lines = inv.invoice_lines ?? [];
    if (lines.length > 0) {
      for (const ln of lines) {
        termBilled += toNumber(ln.amount_usd);
        termPaid += toNumber(ln.paid_usd);
      }
    } else {
      termBilled += toNumber(inv.total_usd);
    }
  }
  const termBalance = Math.max(termBilled - termPaid, 0);

  // === Payment history (skip voids on purpose per spec) ================
  type Alloc = {
    amount_usd: number | string;
    invoice_lines:
      | {
          description?: string;
          invoices?:
            | { period_label?: string }
            | Array<{ period_label?: string }>
            | null;
        }
      | Array<{
          description?: string;
          invoices?:
            | { period_label?: string }
            | Array<{ period_label?: string }>
            | null;
        }>
      | null;
  };
  type PaymentRow = {
    id: string;
    receipt_number: string;
    amount_usd: number | string;
    method: string;
    paid_at: string;
    status: string;
    payer_name_snapshot: string | null;
    payment_allocations: Alloc[] | null;
  };
  const allPayments = (paymentsRes.data ?? []) as PaymentRow[];
  const completed = allPayments.filter((p) => p.status !== "void");
  const history = completed.map((p) => {
    const allocs = p.payment_allocations ?? [];
    const descriptions: string[] = [];
    for (const a of allocs) {
      const ln = Array.isArray(a.invoice_lines)
        ? a.invoice_lines[0]
        : a.invoice_lines;
      if (ln?.description && !descriptions.includes(ln.description)) {
        descriptions.push(ln.description);
      }
    }
    return {
      id: p.id,
      receipt_number: p.receipt_number,
      amount: toNumber(p.amount_usd),
      method: p.method,
      paid_at: p.paid_at,
      payer: p.payer_name_snapshot,
      description: descriptions.join(", ") || "Unallocated payment",
    };
  });
  const lifetimePaid = history.reduce((s, h) => s + h.amount, 0);

  // === Outstanding invoice lines =======================================
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
  const outstanding = ((openLinesRes.data as RawLine[] | null) ?? [])
    .map((raw) => {
      const inv = Array.isArray(raw.invoices) ? raw.invoices[0] : raw.invoices;
      const balance = toNumber(raw.amount_usd) - toNumber(raw.paid_usd);
      return {
        id: raw.id,
        description: raw.description,
        balance,
        period: inv?.period_label ?? null,
        due_date: inv?.due_date ?? null,
        invoice_id: inv?.id ?? null,
      };
    })
    .filter((l) => l.balance > 0.0001)
    .sort((a, b) => {
      const da = a.due_date ?? "9999-12-31";
      const db = b.due_date ?? "9999-12-31";
      return da.localeCompare(db);
    });
  const totalOwed = outstanding.reduce((s, l) => s + l.balance, 0);

  const dob = student.dob as string | null;
  const gender = student.gender as string | null;
  const enrollmentDate = student.enrollment_date as string;
  const status = student.status as "active" | "withdrawn";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/students"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to students
        </Link>
      </div>

      {/* Identity card */}
      <SectionCard bodyClassName="px-5 py-5">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <StudentPhotoUpload
            studentId={id}
            initialUrl={photoUrl}
            initials={initials}
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
              {status === "active" ? (
                <StatusBadge label="Active" variant="success" />
              ) : (
                <StatusBadge label="Withdrawn" variant="neutral" />
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Class
                </dt>
                <dd className="mt-0.5 font-medium">{className ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Gender
                </dt>
                <dd className="mt-0.5 font-medium capitalize">
                  {gender ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Date of birth
                </dt>
                <dd className="mt-0.5 font-medium">
                  {dob ? formatDate(dob) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Enrolled
                </dt>
                <dd className="mt-0.5 font-medium">
                  {formatDate(enrollmentDate)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </SectionCard>

      {/* Current term summary */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <KpiCard
          label={term ? `Billed (${term.name})` : "Billed (no current term)"}
          value={formatMoney(termBilled)}
          hint={term ? `${formatDate(term.start_date)} → ${formatDate(term.end_date)}` : undefined}
        />
        <KpiCard
          label="Paid this term"
          value={formatMoney(termPaid)}
          hint={`Lifetime paid: ${formatMoney(lifetimePaid)}`}
        />
        <KpiCard
          label="Term balance"
          value={formatMoney(termBalance)}
          hint={
            termBalance > 0
              ? "Still owing for the current term"
              : "Term fully paid"
          }
        />
      </div>

      {/* Outstanding invoice lines */}
      <SectionCard
        title="Outstanding fees"
        subtitle={
          outstanding.length === 0
            ? "No open invoice lines for this student."
            : `Total still owed: ${formatMoney(totalOwed)}`
        }
        bodyClassName="p-0"
      >
        {outstanding.length === 0 ? (
          <div className="px-5 py-2">
            <EmptyState
              icon={CalendarDays}
              title="All clear"
              description="No outstanding fees on this student's account."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sp-card-alt">
                <TableRow>
                  <TableHead className="pl-5">Description</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="pr-5 text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstanding.map((ln) => (
                  <TableRow key={ln.id}>
                    <TableCell className="pl-5 font-medium">
                      {ln.invoice_id ? (
                        <Link
                          href={`/invoices/${ln.invoice_id}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {ln.description}
                        </Link>
                      ) : (
                        ln.description
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ln.period ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ln.due_date ? formatDate(ln.due_date) : "—"}
                    </TableCell>
                    <TableCell className="pr-5 text-right font-semibold tabular-nums text-sp-red">
                      {formatMoney(ln.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Payment history */}
      <SectionCard
        title="Payment history"
        subtitle={
          history.length === 0
            ? "No payments recorded yet."
            : `${history.length} payment${history.length === 1 ? "" : "s"} on file. Voided receipts excluded.`
        }
        bodyClassName="p-0"
      >
        {history.length === 0 ? (
          <div className="px-5 py-2">
            <EmptyState
              icon={UserRound}
              title="No payments yet"
              description="Record this student's first payment from /payments."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sp-card-alt">
                <TableRow>
                  <TableHead className="pl-5">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="pl-5 text-muted-foreground">
                      {formatDate(h.paid_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {h.description}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {h.receipt_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {METHOD_LABELS[h.method] ?? h.method}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-primary">
                      {formatMoney(h.amount)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Link
                        href={`/receipts/${h.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
                      >
                        <ReceiptText className="size-3.5" />
                        Receipt
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
