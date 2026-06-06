import Link from "next/link";
import { Check, Star } from "lucide-react";
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
  external?: boolean;
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
    href: process.env.NEXT_PUBLIC_WHOP_STARTER_CHECKOUT ?? "/login",
    external: !!process.env.NEXT_PUBLIC_WHOP_STARTER_CHECKOUT,
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
    href: process.env.NEXT_PUBLIC_WHOP_STANDARD_CHECKOUT ?? "/login",
    external: !!process.env.NEXT_PUBLIC_WHOP_STANDARD_CHECKOUT,
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
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary dark:bg-primary/20">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Honest pricing, paid termly or annually
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            All plans are billed in USD. Pay by EcoCash, bank transfer, or
            cash at the office — annual plans get two months free.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7 transition-all",
                t.highlight
                  ? "border-primary/30 shadow-xl shadow-primary/[0.08] ring-1 ring-primary/20"
                  : "border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.04]",
              )}
            >
              {t.badge ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-primary-foreground shadow-md shadow-primary/20">
                  <Star className="size-3" />
                  {t.badge}
                </span>
              ) : null}

              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">
                  {t.name}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {t.blurb}
                </p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {t.price}
                </span>
                {t.cadence ? (
                  <span className="text-sm text-muted-foreground">
                    {t.cadence}
                  </span>
                ) : null}
              </div>

              <div className="my-6 h-px bg-border" />

              <ul className="flex-1 space-y-3">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[13.5px]"
                  >
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-primary dark:bg-primary/20">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              {t.external ? (
                <a
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                    t.highlight
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:brightness-110"
                      : "border border-border bg-card text-foreground hover:bg-secondary",
                  )}
                >
                  {t.cta}
                </a>
              ) : (
                <Link
                  href={t.href}
                  className={cn(
                    "mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                    t.highlight
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:brightness-110"
                      : "border border-border bg-card text-foreground hover:bg-secondary",
                  )}
                >
                  {t.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[12.5px] text-muted-foreground">
          Schools are non-profit institutions in many cases — talk to us if
          pricing is tight, we&apos;ll work something out.
        </p>
      </div>
    </section>
  );
}
