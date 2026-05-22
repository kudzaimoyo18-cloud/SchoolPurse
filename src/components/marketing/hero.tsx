import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function Hero({ isAuthed = false }: { isAuthed?: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* Layered gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Primary gradient wash */}
        <div className="absolute inset-x-0 top-0 h-[640px] bg-gradient-to-b from-[#0c1929]/[0.04] via-background to-background dark:from-[#0c1929]/40" />
        {/* Radial glow */}
        <div className="absolute left-1/2 top-[-200px] -z-10 size-[800px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[100px] dark:bg-primary/[0.08]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:px-6 sm:pt-20 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            <Image
              src="/marketing/zimbabwe-flag.svg"
              alt="Flag of Zimbabwe"
              width={18}
              height={11}
              className="size-auto rounded-[2px] border border-border/40"
            />
            Built for Zimbabwean schools
            <Sparkles className="size-3 text-amber-500" />
          </span>

          {/* Headline */}
          <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[56px]">
            Track every fee.{" "}
            <span className="bg-gradient-to-r from-primary to-[#0ea5e9] bg-clip-text text-transparent dark:from-primary dark:to-[#38bdf8]">
              Issue every receipt.
            </span>{" "}
            See every report.
          </h1>

          {/* Subline */}
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-[16.5px]">
            SchoolPurse is the internal finance dashboard your bursar and admin
            board need &mdash; manage cash payments, surface arrears, log
            expenses, and watch monthly P&amp;L without leaving the office.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={isAuthed ? "/app/overview" : "/login"}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 hover:brightness-110 sm:w-auto"
            >
              {isAuthed ? "Open dashboard" : "Sign in to your school"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary sm:w-auto"
            >
              See what&apos;s included
            </a>
          </div>

          {/* Trust bar */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Multi-tenant &middot; Row-level isolation per school &middot; Audit-logged
          </div>
        </div>

        {/* Preview card */}
        <div className="mx-auto mt-14 max-w-5xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
