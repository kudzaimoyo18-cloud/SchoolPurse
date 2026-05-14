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
        "id, receipt_number, amount_usd, method, paid_at, status, payer_name_snapshot, recorded_by_name_snapshot, students(first_name, last_name, classes(name))",
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
