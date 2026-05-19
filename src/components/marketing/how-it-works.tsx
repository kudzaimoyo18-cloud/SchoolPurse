import { GraduationCap, Settings2, CreditCard, LineChart } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: GraduationCap,
    title: "Enrol your students",
    body:
      "Add students one at a time or upload your roster as a CSV. Classes, levels, and parent contacts come along for the ride.",
  },
  {
    n: "02",
    icon: Settings2,
    title: "Set your fee structure",
    body:
      "Define fee items per class (Form 1 Tuition, Dev Levy, Exam Fee, Sports Levy) once. Mark which apply on registration vs every term.",
  },
  {
    n: "03",
    icon: CreditCard,
    title: "Record cash payments",
    body:
      "When a parent pays at the office, type the student name, the amount, and the fee item. Receipts auto-number and print instantly.",
  },
  {
    n: "04",
    icon: LineChart,
    title: "Watch the numbers",
    body:
      "The Overview lights up with today's collections, arrears by class, monthly P&L. Export anything to CSV for the board pack.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border bg-sp-card-alt"
    >
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-accent-foreground">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
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
                className="relative flex flex-col rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground">
                    STEP {step.n}
                  </span>
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-sidebar text-primary">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground lg:flex"
                  >
                    →
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
