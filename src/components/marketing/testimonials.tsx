import { Quote } from "lucide-react";

const QUOTES = [
  {
    quote:
      "Before SchoolPurse the bursar was reconciling a paper receipt book against an Excel sheet every Friday evening. Now she clicks one button and the term-end report is ready.",
    author: "Tendai M.",
    role: "Head Teacher, secondary school in Harare",
  },
  {
    quote:
      "The arrears view alone paid for the year. We saw three families in critical status the first morning and quietly followed up. No more guessing who owes what.",
    author: "Ruvimbo C.",
    role: "School Bursar, Mashonaland",
  },
  {
    quote:
      "I needed something I could open on my laptop in a parents' meeting without exposing the whole spreadsheet. SchoolPurse is exactly that — the right detail for the right person.",
    author: "Farai N.",
    role: "Board Treasurer",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-border bg-sp-card-alt">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-accent-foreground">
            What schools are saying
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Built with bursars, head teachers, and treasurers
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure
              key={q.author}
              className="flex flex-col rounded-xl border border-border bg-card p-6"
            >
              <Quote
                className="size-5 text-primary/40"
                strokeWidth={2}
                aria-hidden
              />
              <blockquote className="mt-3 flex-1 text-[14.5px] leading-relaxed text-foreground">
                {q.quote}
              </blockquote>
              <figcaption className="mt-5 border-t border-border pt-3">
                <p className="text-[13px] font-semibold tracking-tight">
                  {q.author}
                </p>
                <p className="text-[11.5px] text-muted-foreground">{q.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
