import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$29",
    cadence: "/ month",
    blurb: "For small schools getting their finance ops off paper.",
    features: [
      "Up to 200 students",
      "1 admin + 1 bursar seat",
      "Cash & receipt tracking",
      "Arrears dashboard",
      "Email support",
    ],
    cta: "Get started",
    href: "/login",
  },
  {
    name: "Standard",
    price: "$79",
    cadence: "/ month",
    blurb: "For most independent schools — every core feature, no caps.",
    features: [
      "Up to 1,000 students",
      "Unlimited admin/bursar seats",
      "All payments, arrears & reports",
      "Printable receipts & invoices",
      "CSV import & export",
      "Audit log",
      "Priority email support",
    ],
    cta: "Start with Standard",
    href: "/login",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Plus",
    price: "Custom",
    cadence: "",
    blurb: "For school groups, holdings, or anyone wanting a hand setting up.",
    features: [
      "Unlimited students & seats",
      "Multiple schools in one account",
      "Onboarding assistance",
      "Custom fee structures imported",
      "Data migration from spreadsheets",
      "Quarterly check-ins",
    ],
    cta: "Talk to us",
    href: "#contact",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-accent-foreground">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Honest pricing, paid termly or annually
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            All plans are billed in USD. Pay by EcoCash, bank transfer, or
            cash at the office — annual plans get two months free.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-6 transition",
                t.highlight
                  ? "border-primary shadow-[0_18px_40px_-20px_rgba(34,194,122,0.45)] ring-1 ring-primary/30"
                  : "border-border hover:border-primary/30",
              )}
            >
              {t.badge ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
                  {t.badge}
                </span>
              ) : null}

              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold tracking-tight">
                  {t.name}
                </h3>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {t.blurb}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {t.price}
                </span>
                {t.cadence ? (
                  <span className="text-sm text-muted-foreground">
                    {t.cadence}
                  </span>
                ) : null}
              </div>

              <ul className="mt-5 space-y-2.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13.5px]"
                  >
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={t.href}
                className={cn(
                  "mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition",
                  t.highlight
                    ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                    : "border border-border bg-card text-foreground hover:bg-sp-card-alt",
                )}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[12.5px] text-muted-foreground">
          Schools are non-profit institutions in many cases — talk to us if
          pricing is tight, we&apos;ll work something out.
        </p>
      </div>
    </section>
  );
}
