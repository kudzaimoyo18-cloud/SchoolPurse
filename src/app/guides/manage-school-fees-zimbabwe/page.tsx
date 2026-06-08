import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

const URL = "https://schoolpurse.app/guides/manage-school-fees-zimbabwe";
const TITLE =
  "How to Manage School Fees in Zimbabwe (2026 Guide) | SchoolPurse";
const DESC =
  "A step-by-step guide to managing school fees in Zimbabwe: setting fee items, invoicing students, recording cash and mobile-money payments, issuing receipts, and tracking arrears — from the team that built SchoolPurse.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/guides/manage-school-fees-zimbabwe" },
  openGraph: { title: TITLE, description: DESC, url: URL, type: "article" },
};

const LEDE =
  "To manage school fees in Zimbabwe without a cash book: define your term fee items, invoice every student, record each payment (cash, bank transfer or mobile money) with a numbered receipt, and track arrears against the term's collection rate. Below is the exact process, why the old way loses money, and a worked example.";

const EXPERIENCE =
  "We built SchoolPurse in 2026 after watching Zimbabwean schools struggle with the same problem: fees collected in cash, written into a receipt book, and reconciled by hand at the end of term. The steps below are the workflow we designed the product around, refined from how bursars actually run fee collection.";

const STEPS: { title: string; body: string }[] = [
  {
    title: "List your fee items",
    body: "Write down everything you charge for the term — tuition, development levy, sports, ICT, exams, transport, boarding. For each one decide which classes it applies to and whether it is charged per term, per month, or once on registration. This list is the backbone of every invoice.",
  },
  {
    title: "Set your academic year and current term",
    body: "Fees attach to a term, so define the current academic year and term before invoicing. Most Zimbabwean schools run three terms a year. Your invoices, receipts and fee-collection rate are all calculated against the active term.",
  },
  {
    title: "Add or import your students",
    body: "Enter students one by one, or import a CSV of the whole school at once, assigning each student to a class. The class is what decides which fee items that student is charged, so get the class list right first.",
  },
  {
    title: "Generate the term's invoices",
    body: "Create one invoice per active student for the current term, listing the fee items that apply to their class. Doing this in one batch means every parent is billed the correct amount and nothing is missed.",
  },
  {
    title: "Record every payment and issue a receipt",
    body: "When a parent pays — cash at the office, bank transfer, or mobile money such as EcoCash, OneMoney or InnBucks — record the amount, date and method. A numbered receipt (for example TSJS-2026-000412) is issued to the parent and the student's outstanding balance updates immediately.",
  },
  {
    title: "Track arrears and your collection rate",
    body: "Review the arrears list — every student who still owes, largest balance first — and the term's overall collection rate. Following up early, while the term is still running, is the single biggest lever on how much of your fees you actually collect.",
  },
];

const MISTAKES = [
  "Recording payments in two places (a book and a spreadsheet) so the totals never agree.",
  "Issuing receipts without a sequential number, which makes a voided or duplicate payment impossible to trace.",
  "Only looking at arrears at the end of term, when it is too late to follow up.",
  "Charging the same fees to every class instead of mapping fee items to the classes they apply to.",
];

const EXAMPLE =
  "Illustrative example (sample figures, not a specific school): a 220-student primary school charges 180 USD tuition plus a 40 USD levy per term. That is 48,400 USD invoiced for the term. By recording each payment as it comes in, the bursar can see on any day that, say, 78 percent has been collected and 3,150 USD is still outstanding across 14 students — and follow up those 14 families directly, instead of discovering the gap after the term ends.";

const ACCURACY =
  "Pricing, features and currencies on this page reflect SchoolPurse as of June 2026. The example figures are illustrative. Spotted an error? Email support@schoolpurse.app and we will correct it.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://schoolpurse.app/#org",
      name: "SchoolPurse",
      url: "https://schoolpurse.app",
      logo: "https://schoolpurse.app/logo.png",
      foundingDate: "2026",
      founder: { "@type": "Person", name: "Kudzai Moyo" },
      areaServed: ["Zimbabwe", "Africa"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@schoolpurse.app",
        contactType: "customer support",
      },
    },
    {
      "@type": "Article",
      "@id": URL + "#article",
      headline: "How to Manage School Fees in Zimbabwe (2026 Guide)",
      description: DESC,
      datePublished: "2026-06-08",
      dateModified: "2026-06-08",
      inLanguage: "en",
      author: { "@type": "Person", name: "Kudzai Moyo" },
      publisher: { "@id": "https://schoolpurse.app/#org" },
      image: "https://schoolpurse.app/logo.png",
      mainEntityOfPage: URL,
    },
    {
      "@type": "HowTo",
      name: "How to manage school fees in Zimbabwe",
      description:
        "Define fee items, set the term, add students, invoice, record payments with receipts, and track arrears.",
      totalTime: "PT30M",
      step: STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.body,
        url: URL + "#step-" + (i + 1),
      })),
    },
  ],
};

export default async function GuidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <MarketingNav isAuthed={!!user} />
      <main className="bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className="mx-auto max-w-3xl px-5 py-20 sm:px-6 lg:py-28">
          <nav className="text-[12px] text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span>Guides</span>
          </nav>

          <header className="mt-4">
            <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary dark:bg-primary/20">
              Guide
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              How to manage school fees in Zimbabwe
            </h1>
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              By Kudzai Moyo, SchoolPurse &middot; Updated June 2026 &middot; ~6
              min read
            </p>
            <p className="mt-6 text-[15px] font-medium leading-relaxed text-foreground">
              {LEDE}
            </p>
          </header>

          <section className="mt-10">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {EXPERIENCE}
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-[22px] font-bold tracking-[-0.01em]">
              Why cash and paper cost schools money
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              When fees live in a receipt book, mistakes compound. Receipts go
              missing, two people write in the same book, and a parent who says
              they paid cannot be checked against a clear record. Arrears stay
              invisible until the end of term, when there is no time left to
              recover them. The school is busiest exactly when its money is
              hardest to see.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-[22px] font-bold tracking-[-0.01em]">
              How to manage school fees, step by step
            </h2>
            <ol className="mt-6 space-y-8">
              {STEPS.map((s, i) => (
                <li key={s.title} id={"step-" + (i + 1)} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold">{s.title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="text-[22px] font-bold tracking-[-0.01em]">
              A worked example
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              {EXAMPLE}
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-[22px] font-bold tracking-[-0.01em]">
              Doing it manually vs with software
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              A spreadsheet works for a small school, but it breaks down as
              student numbers grow: formulas drift, receipts are not numbered,
              and two staff editing the same file overwrite each other. Purpose
              built software keeps invoices, receipts, payment methods and
              arrears in one consistent place. SchoolPurse does exactly this for
              African schools, with mobile-money support and pricing from 29 USD
              per month for up to 200 students.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-[22px] font-bold tracking-[-0.01em]">
              Common mistakes to avoid
            </h2>
            <ul className="mt-4 space-y-2.5">
              {MISTAKES.map((m) => (
                <li
                  key={m}
                  className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {m}
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-16 rounded-2xl border border-border bg-muted/40 p-6">
            <p className="text-[14px] font-semibold">
              Manage your school&apos;s fees in one place
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              SchoolPurse runs this whole workflow for you. See{" "}
              <Link
                href="/faq"
                className="text-primary underline-offset-2 hover:underline"
              >
                common questions
              </Link>
              , or{" "}
              <Link
                href="/login"
                className="text-primary underline-offset-2 hover:underline"
              >
                sign in to start
              </Link>
              .
            </p>
            <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
              {ACCURACY}
            </p>
          </footer>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}