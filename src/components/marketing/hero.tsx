import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function Hero({ isAuthed = false }: { isAuthed?: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-primary/[0.06] via-background to-background dark:from-primary/[0.12]" />
        <div className="absolute left-1/2 top-[-160px] -z-10 size-[680px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/[0.10]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3 text-primary" />
            Built for Zimbabwean schools
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-[58px]">
            Track every fee.{" "}
            <span className="text-primary">Issue every receipt.</span>{" "}
            See every report.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15.5px] leading-relaxed text-muted-foreground sm:text-base">
            SchoolPurse is the internal finance dashboard your bursar and admin
            board need — manage cash payments, surface arrears, log expenses,
            and watch monthly P&amp;L without leaving the office.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={isAuthed ? "/app/overview" : "/login"}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 sm:w-auto"
            >
              {isAuthed ? "Open dashboard" : "Sign in to your school"}
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-sp-card-alt sm:w-auto"
            >
              See what&apos;s included
            </a>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Multi-tenant. Row-level isolation per school. Audit-logged.
          </div>
        </div>

        {/* Preview card */}
        <div className="mx-auto mt-12 max-w-5xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
