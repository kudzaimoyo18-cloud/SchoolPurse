import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import { PrintButton } from "./print-button";

export const metadata = { title: "Receipt — SchoolPurse" };

function amountInWords(value: number): string {
  // Friendly compact rendering of money in words for the receipt — handles
  // typical school fee amounts. Falls back to numeric for very large values.
  if (!Number.isFinite(value) || value < 0) return "";
  const whole = Math.floor(value);
  const cents = Math.round((value - whole) * 100);

  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  function under1000(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return tens[t] + (o ? "-" + ones[o] : "");
    }
    const h = Math.floor(n / 100);
    const r = n % 100;
    return ones[h] + " hundred" + (r ? " and " + under1000(r) : "");
  }

  function inWords(n: number): string {
    if (n === 0) return "zero";
    if (n > 999_999_999) return n.toLocaleString();
    const billions = Math.floor(n / 1_000_000_000);
    const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
    const thousands = Math.floor((n % 1_000_000) / 1000);
    const rest = n % 1000;
    const parts: string[] = [];
    if (billions) parts.push(under1000(billions) + " billion");
    if (millions) parts.push(under1000(millions) + " million");
    if (thousands) parts.push(under1000(thousands) + " thousand");
    if (rest) parts.push(under1000(rest));
    return parts.join(" ");
  }

  let result = inWords(whole) + " US dollars";
  if (cents > 0) result += " and " + inWords(cents) + " cents";
  return result.replace(/\b\w/g, (m) => m.toUpperCase());
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [paymentRes, schoolRes] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, receipt_number, amount_usd, method, paid_at, status, payer_name_snapshot, recorded_by_name_snapshot, student_id, students(first_name, last_name, classes(name)), payment_allocations(amount_usd, invoice_lines(description, invoices(period_label)))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("schools")
      .select("name, address, phone, receipt_prefix")
      .limit(1)
      .maybeSingle(),
  ]);

  const payment = paymentRes.data;
  if (!payment) {
    notFound();
  }
  const p = payment as Record<string, unknown>;

  // Compute the student's outstanding balance after this payment is applied.
  // We sum amount_usd - paid_usd across all OPEN/PARTIAL invoices for the
  // student, where paid_usd is the post-trigger materialised value.
  const studentId = p.student_id as string;
  const { data: balanceLines } = await supabase
    .from("invoice_lines")
    .select(
      "amount_usd, paid_usd, invoices!inner(id, student_id, status)",
    )
    .eq("invoices.student_id", studentId)
    .in("invoices.status", ["open", "partial"]);
  type BalLine = {
    amount_usd: number | string;
    paid_usd: number | string;
  };
  const outstanding = ((balanceLines as BalLine[] | null) ?? []).reduce(
    (sum, ln) => sum + Math.max(toNumber(ln.amount_usd) - toNumber(ln.paid_usd), 0),
    0,
  );
  const school = (schoolRes.data ?? {
    name: "SchoolPurse",
    address: null,
    phone: null,
    receipt_prefix: "SP",
  }) as {
    name: string;
    address: string | null;
    phone: string | null;
    receipt_prefix: string;
  };

  const studentField = p.students as
    | { first_name?: string; last_name?: string; classes?: unknown }
    | Array<{ first_name?: string; last_name?: string; classes?: unknown }>
    | null;
  const s = Array.isArray(studentField) ? studentField[0] : studentField;
  const classField = s?.classes as
    | { name?: string }
    | { name?: string }[]
    | undefined;
  const className = Array.isArray(classField)
    ? classField[0]?.name
    : classField?.name;

  const methodLabel: Record<string, string> = {
    cash: "Cash",
    bank_transfer: "Bank transfer",
    mobile_money: "Mobile money",
  };

  const amount = toNumber(p.amount_usd);

  // Build the "PAYMENT FOR" summary from payment_allocations. Each allocation
  // points at an invoice_line; we group identical descriptions and sum their
  // amounts so the receipt reads naturally even when a single payment was
  // split (e.g. $100 toward Tuition + $20 toward Sports levy).
  type Alloc = {
    amount_usd: number | string;
    invoice_lines:
      | {
          description?: string;
          invoices?: { period_label?: string } | Array<{ period_label?: string }> | null;
        }
      | Array<{
          description?: string;
          invoices?: { period_label?: string } | Array<{ period_label?: string }> | null;
        }>
      | null;
  };
  const allocations = (p.payment_allocations as Alloc[] | null) ?? [];
  const allocLines: Array<{ description: string; amount: number; period: string | null }> = [];
  for (const a of allocations) {
    const ln = Array.isArray(a.invoice_lines) ? a.invoice_lines[0] : a.invoice_lines;
    if (!ln?.description) continue;
    const invField = ln.invoices;
    const inv = Array.isArray(invField) ? invField[0] : invField;
    const period = inv?.period_label ?? null;
    const allocAmount = toNumber(a.amount_usd);
    const existing = allocLines.find(
      (x) => x.description === ln.description && x.period === period,
    );
    if (existing) {
      existing.amount += allocAmount;
    } else {
      allocLines.push({ description: ln.description, amount: allocAmount, period });
    }
  }
  const allocatedTotal = allocLines.reduce((sum, l) => sum + l.amount, 0);
  const unallocated = Math.max(amount - allocatedTotal, 0);

  return (
    <div className="min-h-svh bg-sp-card-alt py-10 print:bg-white print:py-0">
      <style>{`@media print { @page { margin: 14mm; } .no-print { display: none !important; } }`}</style>

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 print:px-0">
        <div className="no-print flex items-center justify-between">
          <a
            href="/payments"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Back to payments
          </a>
          <PrintButton />
        </div>

        <div className="rounded-lg border border-border bg-white p-10 text-foreground shadow-sm print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 border-b border-border pb-6">
            <div>
              <div className="mb-2 inline-flex size-9 items-center justify-center rounded-md bg-sidebar text-primary">
                <Briefcase className="size-4" strokeWidth={2.2} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                {school.name}
              </h1>
              {school.address ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {school.address}
                </p>
              ) : null}
              {school.phone ? (
                <p className="text-xs text-muted-foreground">
                  Tel: {school.phone}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                Official Receipt
              </p>
              <p className="mt-1 font-mono text-base font-bold">
                {String(p.receipt_number)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(p.paid_at as string)}
              </p>
              {p.status === "void" ? (
                <p className="mt-2 inline-block rounded-md bg-sp-red-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-sp-red">
                  VOID
                </p>
              ) : null}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                  Received from
                </p>
                <p className="mt-1 font-medium">
                  {p.payer_name_snapshot
                    ? String(p.payer_name_snapshot)
                    : "Parent / Guardian"}
                </p>
                <p className="text-xs text-muted-foreground">
                  For student: {s ? `${s.first_name} ${s.last_name}` : "—"}
                  {className ? ` (${className})` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                  Payment method
                </p>
                <p className="mt-1 font-medium">
                  {methodLabel[String(p.method)] ?? String(p.method)}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-sp-card-alt px-5 py-4">
              <div className="flex items-end justify-between">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                  Amount paid
                </p>
                <p className="text-3xl font-bold tracking-tight tabular-nums text-primary">
                  {formatMoney(amount)}
                </p>
              </div>
              <p className="mt-1 text-xs italic text-muted-foreground">
                {amountInWords(amount)}
              </p>
            </div>

            {/* Payment-for summary — shows which fee items this payment was
                applied to. Hidden for void receipts and for payments with no
                allocations (e.g. credit/advance payments). */}
            {p.status !== "void" && allocLines.length > 0 ? (
              <div className="rounded-md border border-border px-5 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                  Payment for
                </p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {allocLines.map((ln, i) => (
                    <li
                      key={`${ln.description}-${i}`}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="flex-1">
                        <span className="font-medium">{ln.description}</span>
                        {ln.period ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            · {ln.period}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatMoney(ln.amount)}
                      </span>
                    </li>
                  ))}
                  {unallocated > 0.0001 ? (
                    <li className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-1 text-xs italic text-muted-foreground">
                      <span>Unallocated (credit on account)</span>
                      <span className="tabular-nums">
                        {formatMoney(unallocated)}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {/* Balance summary — hidden for void receipts */}
            {p.status !== "void" ? (
              <div className="rounded-md border border-border px-5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                    Balance remaining
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${outstanding > 0 ? "text-sp-red" : "text-sp-green"}`}
                  >
                    {formatMoney(outstanding)}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {outstanding > 0
                    ? "Across all open invoices for this student after this payment."
                    : "All open invoices for this student are now paid in full."}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-6 pt-6">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                  Received by
                </p>
                <p className="mt-1 text-sm">
                  {p.recorded_by_name_snapshot
                    ? String(p.recorded_by_name_snapshot)
                    : "Bursar"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                  Signature
                </p>
                <div className="mt-6 border-b border-foreground/40" />
              </div>
            </div>
          </div>

          <p className="border-t border-border pt-4 text-center text-[10.5px] text-muted-foreground">
            This is a computer-generated receipt. Keep it for your records.
          </p>
        </div>
      </div>
    </div>
  );
}
