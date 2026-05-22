"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    q: "Is SchoolPurse a payment gateway?",
    a: "No — and that's deliberate. SchoolPurse is a tracking tool for your admin board. Parents still pay you the way they always have (cash at the office, bank transfer, EcoCash). You record what came in; we organise it.",
  },
  {
    q: "Do parents or students log in?",
    a: "No. The platform is internal-only. Only your admin board members (Head, Bursar, Teachers) have accounts. Your finance data never leaves your team.",
  },
  {
    q: "How is data kept private between schools?",
    a: "Every school has its own row-level isolated workspace in our Supabase Postgres database. We use Supabase Row-Level Security so even if someone could query the DB, they'd only ever see their own school's data.",
  },
  {
    q: "Can we import our existing student roster?",
    a: "Yes — there's a CSV import on the Students page. Columns: first_name, last_name, class, dob, gender, enrollment_date. Class names need to match what you've set up in SchoolPurse.",
  },
  {
    q: "What currencies are supported?",
    a: "USD only in v1, which is how most Zim private schools invoice. The architecture supports adding ZWG/ZiG later without rebuilding anything.",
  },
  {
    q: "Can we self-host this?",
    a: "The project is built on standard open-source pieces (Next.js, Supabase, Postgres) so technically yes. We don't sell a self-hosted licence today — get in touch if you need that.",
  },
  {
    q: "What happens to receipts if a payment is voided?",
    a: "Voided payments stay in the ledger with a VOID status and a reason field. The receipt remains accessible but is clearly marked. Nothing is ever hard-deleted — auditors love that.",
  },
  {
    q: "Can I print receipts from a phone?",
    a: "Yes — the receipt page is print-friendly on any device. Print to PDF, share via WhatsApp, or use a thermal printer paired to a phone for office printing.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = React.useState(false);
  const id = `faq-panel-${index}`;
  const headingId = `faq-trigger-${index}`;

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:text-primary"
      >
        <span className="text-[14.5px] font-semibold">{q}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />
      </button>
      <div
        id={id}
        role="region"
        aria-labelledby={headingId}
        hidden={!open}
        className={cn(open ? "pb-5 pr-8" : "")}
      >
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          {a}
        </p>
      </div>
    </li>
  );
}

export function Faq() {
  return (
    <section id="faq" className="border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="text-center">
          <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary dark:bg-primary/20">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Questions schools ask us
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
            Don&apos;t see your question? Drop us a message below — we read
            everything.
          </p>
        </div>

        <ul className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card px-6 shadow-sm">
          {QUESTIONS.map((item, i) => (
            <FaqItem key={item.q} q={item.q} a={item.a} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
