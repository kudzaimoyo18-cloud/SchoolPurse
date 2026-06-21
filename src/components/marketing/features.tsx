import {
  Receipt,
  AlertTriangle,
  BarChart3,
  Sparkles,
  MessageSquare,
  Send,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  tag?: "Free" | "AI";
};

const FEATURES: Feature[] = [
  {
    icon: Receipt,
    title: "Free for up to 100 students",
    body: "Record cash, EcoCash and transfers, issue sequential receipts, and track every student's balance — at no cost. The whole fee book for a small school, free forever.",
    tag: "Free",
  },
  {
    icon: AlertTriangle,
    title: "Arrears you can act on",
    body: "Critical / Moderate / Recent badges by days overdue, per-class collection progress, total outstanding by form. See exactly who to chase today.",
  },
  {
    icon: BarChart3,
    title: "Reports your board will read",
    body: "Monthly income vs expenses, year-to-date surplus, margins and expense breakdowns. E-Report Books for pupils. CSV export for the auditor.",
  },
  {
    icon: Sparkles,
    title: "AI finance assistant",
    body: "Ask your fees, arrears and P&L in plain English or Shona — “who owes the most?”, “how much did we collect this month?” — and get an instant answer.",
    tag: "AI",
  },
  {
    icon: MessageSquare,
    title: "In-app messages & class groups",
    body: "School notices, staff room and a group per class, all in one place. No more scattered WhatsApp groups to keep track of.",
    tag: "AI",
  },
  {
    icon: Send,
    title: "Automated WhatsApp reminders",
    body: "Personalised fee reminders to parents, sent from your school's identity — so families pay faster, without the awkward phone calls.",
    tag: "AI",
  },
];

export function Features() {
  return (
    <section id="features" className="relative border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary dark:bg-primary/20">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Everything the office needs — and a smart layer on top
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Start free with the fee book your bursar uses daily. Upgrade for the
            AI assistant, in-app messaging and WhatsApp reminders.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.04]"
              >
                <div className="absolute left-0 top-6 h-8 w-[3px] rounded-r-full bg-primary/20 transition-all group-hover:h-10 group-hover:bg-primary/50" />

                <div className="flex items-center justify-between">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-primary/20">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </span>
                  {f.tag ? (
                    <span
                      className={
                        f.tag === "Free"
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                          : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                      }
                    >
                      {f.tag === "AI" ? (
                        <Sparkles className="size-2.5" />
                      ) : null}
                      {f.tag} {f.tag === "AI" ? "plan" : ""}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
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
