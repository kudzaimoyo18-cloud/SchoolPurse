import {
  CreditCard,
  AlertTriangle,
  Receipt,
  BarChart3,
  Users,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: CreditCard,
    title: "Cash payments, properly recorded",
    body:
      "Record cash at the office in seconds with student autocomplete. Each payment auto-allocates against the oldest open invoice and issues a sequential receipt number.",
  },
  {
    icon: AlertTriangle,
    title: "Arrears you can act on",
    body:
      "Critical / Moderate / Recent badges by days overdue, per-class collection progress, total outstanding by form. Spot who to chase, today.",
  },
  {
    icon: Receipt,
    title: "Printable receipts on demand",
    body:
      "Every payment becomes a receipt with school header, registration details, amount in words, and a signature line. Print to PDF in one click.",
  },
  {
    icon: BarChart3,
    title: "Reports your board will actually read",
    body:
      "Monthly income vs expenses, YTD net surplus, margin trends, expense breakdowns by category. CSV export for the auditor.",
  },
  {
    icon: Users,
    title: "Students, fees & invoices",
    body:
      "Enrol students (one-by-one or via CSV), set per-class fee structures, and generate a full term's invoices for every active student with one click.",
  },
  {
    icon: ShieldCheck,
    title: "Built for the admin board",
    body:
      "Role-based access (Head, Bursar, Teacher), full audit trail, multi-tenant isolation. No parent or student logins — your data, your team only.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-accent-foreground">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Every finance task in one place
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Designed for the bursar&apos;s day-to-day, not for a quarterly board
            meeting. Open the laptop, record the cash, print the receipt.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/30 hover:shadow-sm"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-accent text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-4.5" strokeWidth={2} />
                </span>
                <h3 className="mt-3.5 text-[15px] font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
