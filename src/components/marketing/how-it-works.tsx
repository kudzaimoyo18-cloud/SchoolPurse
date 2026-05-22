import { GraduationCap, Settings2, CreditCard, LineChart } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: GraduationCap,
    title: "Enrol your students",
    body: "Add students one at a time or upload your roster as a CSV. Classes, levels, and parent contacts come along for the ride.",
  },
  {
    n: "02",
    icon: Settings2,
    title: "Set your fee structure",
    body: "Define fee items per class (Form 1 Tuition, Dev Levy, Exam Fee, Sports Levy) once. Mark which apply on registration vs every term.",
  },
  {
    n: "03",
    icon: CreditCard,
    title: "Record cash payments",
    body: "When a parent pays at the office, type the student name, the amount, and the fee item. Receipts auto-number and print instantly.",
  },
  {
    n: "04",
    icon: LineChart,
    title: "Watch the numbers",
    body: "The Overview lights up with today's collections, arrears by class, monthly P&L. Export anything to CSV for the board pack.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary dark:bg-primary/20">
            How it works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            From spreadsheet to working dashboard in an afternoon
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Four steps. No installs, no payment gateway setup, no parent
            onboarding required.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.n}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-6"
              >
                {/* Step number watermark */}
                <span className="absolute right-4 top-3 font-mono text-[48px] font-bold leading-none text-primary/[0.06] dark:text-primary/[0.08]">
                  {step.n}
                </span>

                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Icon className="size-4.5" strokeWidth={2} />
                  </span>
                  <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                    STEP {step.n}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>

                {/* Connector arrow */}
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute -right-2.5 top-1/2 hidden size-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-xs text-muted-foreground shadow-sm lg:flex"
                  >
                    &rarr;
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
