import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import { getLogoUrl } from "@/lib/storage";
import { PrintButton } from "@/app/app/receipts/[id]/print-button";

export const metadata = { title: "Invoice — SchoolPurse" };

interface LineRow {
  id: string;
  description: string;
  amount_usd: number | string;
  paid_usd: number | string;
  payment_allocations:
    | Array<{
        amount_usd: number | string;
        payments?: { status?: string } | Array<{ status?: string }> | null;
      }>
    | null;
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [invoiceRes, schoolRes] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        `id, period_label, due_date, total_usd, status, is_registration, created_at,
         students(first_name, last_name, classes(name)),
         terms(name, start_date, end_date),
         invoice_lines(id, description, amount_usd, paid_usd,
                       payment_allocations(amount_usd, payments(status)))`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("schools")
      .select("name, address, phone, receipt_prefix, logo_path")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!invoiceRes.data) notFound();
  const inv = invoiceRes.data as Record<string, unknown>;

  const school = (schoolRes.data ?? {
    name: "SchoolPurse",
    address: null,
    phone: null,
    receipt_prefix: "SP",
    logo_path: null,
  }) as {
    name: string;
    address: string | null;
    phone: string | null;
    receipt_prefix: string;
    logo_path: string | null;
  };
  const logoUrl = await getLogoUrl(school.logo_path);

  const studentField = inv.students as
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
  const studentName = s
    ? `${(s.first_name ?? "").trim()} ${(s.last_name ?? "").trim()}`.trim()
    : "Unknown";

  const termField = inv.terms as
    | { name?: string; start_date?: string; end_date?: string }
    | Array<{ name?: string; start_date?: string; end_date?: string }>
    | null;
  const term = Array.isArray(termField) ? termField[0] : termField;

  const lines = ((inv.invoice_lines as LineRow[] | null) ?? []).map((ln) => {
    const allocs = ln.payment_allocations ?? [];
    const paidFromAllocs = allocs.reduce((sum, a) => {
      const pay = Array.isArray(a.payments) ? a.payments[0] : a.payments;
      if (pay?.status === "void") return sum;
      return sum + toNumber(a.amount_usd);
    }, 0);
    const paid = Math.max(toNumber(ln.paid_usd), paidFromAllocs);
    const amount = toNumber(ln.amount_usd);
    return {
      id: ln.id,
      description: ln.description,
      amount,
      paid,
      balance: Math.max(amount - paid, 0),
    };
  });

  const total = lines.reduce((s, l) => s + l.amount, 0) || toNumber(inv.total_usd);
  const paid = lines.reduce((s, l) => s + l.paid, 0);
  const balance = Math.max(total - paid, 0);

  const statusLabel =
    balance <= 0.0001
      ? { label: "Paid in full", color: "text-sp-green" }
      : paid > 0
        ? { label: "Partially paid", color: "text-sp-amber" }
        : { label: "Open", color: "text-sp-red" };

  const invoiceNumber = `${school.receipt_prefix}-INV-${id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-svh bg-sp-card-alt py-10 print:bg-white print:py-0">
      <style>{`@media print { @page { margin: 14mm; } .no-print { display: none !important; } }`}</style>

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 print:px-0">
        <div className="no-print flex items-center justify-between">
          <a
            href="/app/arrears"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Back to arrears
          </a>
          <PrintButton />
        </div>

        <div className="rounded-lg border border-border bg-white p-10 text-foreground shadow-sm print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 border-b border-border pb-6">
            <div>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`${school.name} logo`}
                  className="mb-2 max-h-14 max-w-[160px] object-contain"
                />
              ) : (
                <div className="mb-2 inline-flex size-9 items-center justify-center rounded-md bg-sidebar text-primary">
                  <Briefcase className="size-4" strokeWidth={2.2} />
                </div>
              )}
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
                {inv.is_registration ? "Registration Invoice" : "Invoice"}
              </p>
              <p className="mt-1 font-mono text-sm font-bold">
                {invoiceNumber}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Issued {formatDate(inv.created_at as string)}
              </p>
              {inv.due_date ? (
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(inv.due_date as string)}
                </p>
              ) : null}
            </div>
          </div>

          {/* Bill-to */}
          <div className="grid grid-cols-2 gap-6 py-6">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                Bill to
              </p>
              <p className="mt-1 font-medium">{studentName}</p>
              {className ? (
                <p className="text-xs text-muted-foreground">
                  Class: {className}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                Period
              </p>
              <p className="mt-1 text-sm font-medium">
                {(inv.period_label as string) ?? "—"}
              </p>
              {term?.start_date && term?.end_date ? (
                <p className="text-xs text-muted-foreground">
                  {formatDate(term.start_date)} – {formatDate(term.end_date)}
                </p>
              ) : null}
            </div>
          </div>

          {/* Line items */}
          <table className="w-full border-t border-border">
            <thead>
              <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 px-3 text-right">Charged</th>
                <th className="py-2 px-3 text-right">Paid</th>
                <th className="py-2 pl-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {lines.map((ln) => (
                <tr key={ln.id} className="border-t border-border/60">
                  <td className="py-2.5 pr-3">{ln.description}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatMoney(ln.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                    {formatMoney(ln.paid)}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-medium tabular-nums">
                    {formatMoney(ln.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Total invoiced</span>
              <span className="font-medium tabular-nums">
                {formatMoney(total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount paid</span>
              <span className="font-medium tabular-nums text-primary">
                −{formatMoney(paid)}
              </span>
            </div>
            <div className="flex justify-between border-t border-foreground/40 pt-2 text-base font-bold">
              <span>Balance due</span>
              <span
                className={`tabular-nums ${balance > 0 ? "text-sp-red" : "text-sp-green"}`}
              >
                {formatMoney(balance)}
              </span>
            </div>
            <p className={`mt-1 text-right text-[11px] font-semibold uppercase tracking-wide ${statusLabel.color}`}>
              {statusLabel.label}
            </p>
          </div>

          <p className="mt-10 border-t border-border pt-4 text-center text-[10.5px] text-muted-foreground">
            Please pay the balance to the school bursar. Bring this invoice
            with you so a receipt can be issued in your name.
          </p>
        </div>
      </div>
    </div>
  );
}
