import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

const PAGE_TITLE = "School Fee Management — Questions & Answers | SchoolPurse";
const PAGE_DESC =
  "How schools in Zimbabwe and across Africa manage student fees with SchoolPurse: invoicing, mobile-money payments, automatic receipts, arrears, pricing and security. Answers from the team that built it.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: "https://schoolpurse.app/faq",
    type: "article",
  },
};

const INTRO =
  "We built SchoolPurse in 2026 after watching Zimbabwean schools lose money to cash receipt books and untracked arrears. This page answers the questions school heads and bursars ask us most — and the questions people search for when they want to move school fees off paper.";

const KEY_FACTS = [
  "SchoolPurse is school fee management software for African schools — web and Android.",
  "It invoices term fees, records payments (cash, bank transfer, mobile money), issues numbered receipts, and tracks arrears in real time.",
  "Pricing starts at 35 USD per month for up to 50 students (Starter); 50 USD per month for up to 250 students (Pro). The AI tier is custom-priced for unlimited students.",
  "Each school's data is isolated with row-level security; access is role-based for heads, bursars and teachers.",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do schools in Zimbabwe manage student fees?",
    a: "Many schools still track fees on paper or in a spreadsheet, writing cash payments into a receipt book. SchoolPurse replaces that with a digital system: it invoices each student for the term's fee items, records every payment by cash, bank transfer or mobile money, issues a numbered receipt, and shows exactly who still owes. The bursar always sees the school's true cash position instead of reconciling a notebook at the end of term.",
  },
  {
    q: "What is the best software to track school fees in Africa?",
    a: "The right tool depends on school size and budget, but most options are built for Western schools and assume card payments and online portals. SchoolPurse is purpose-built for African schools: it supports USD, mobile-money methods like EcoCash and OneMoney, term-based fee structures, and runs on low-end Android phones and any browser. Plans start at 35 USD per month for up to 50 students.",
  },
  {
    q: "How can a school generate fee receipts automatically?",
    a: "In SchoolPurse, recording a payment automatically creates a sequential, school-branded receipt — for example TSJS-2026-000412 — that can be printed or emailed to the parent. The student's outstanding balance updates instantly, so there is no separate step to issue a receipt or recalculate what is owed.",
  },
  {
    q: "How do schools know which parents have not paid fees?",
    a: "SchoolPurse has an Arrears view that lists every student with an outstanding balance, largest first, with their class and the amount owed. The dashboard also shows the term's overall fee-collection rate, so a head can see at a glance how much of the term's fees have actually come in.",
  },
  {
    q: "Does SchoolPurse support mobile money like EcoCash?",
    a: "Yes. SchoolPurse is a tracking tool, not a payment gateway, so parents keep paying the way they already do — cash at the office, bank transfer, or mobile money such as EcoCash, OneMoney or InnBucks. You record which method was used, and the receipt and ledger reflect how the parent actually paid.",
  },
  {
    q: "How much does SchoolPurse cost?",
    a: "SchoolPurse Starter is 35 USD per month for up to 50 students, and Pro is 50 USD per month for up to 250 students. The AI tier — unlimited students, plus the AI finance assistant and automated WhatsApp fee reminders — is custom-priced. Billing is monthly, and there is no setup fee.",
  },
  {
    q: "Is SchoolPurse secure for school financial data?",
    a: "Yes. SchoolPurse runs over HTTPS and gives every school its own isolated workspace using database row-level security, so one school can never see another's data. Access is role-based: a bursar sees finance but not settings, and a teacher sees only students — never the school's payment records.",
  },
  {
    q: "How do I set up my school on SchoolPurse?",
    a: "After signing up you add your school's name and branding, turn on your school levels (which automatically creates your class list), add your fee items, then import students and generate the term's invoices. Most schools are fully set up in under 30 minutes.",
  },
];

const ACCURACY =
  "Facts on this page (pricing, features and currencies) reflect SchoolPurse as of June 2026. Spotted something out of date? Email support@schoolpurse.app and we will correct it.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://schoolpurse.app/#org",
      name: "SchoolPurse",
      url: "https://schoolpurse.app",
      logo: "https://schoolpurse.app/logo.png",
      description:
        "School fee management software built for African schools — track fees, record payments, issue receipts, and monitor arrears.",
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
      "@type": "SoftwareApplication",
      "@id": "https://schoolpurse.app/#app",
      name: "SchoolPurse",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, Android",
      url: "https://schoolpurse.app",
      publisher: { "@id": "https://schoolpurse.app/#org" },
      description:
        "SchoolPurse helps schools invoice term fees, record payments (cash, bank transfer, mobile money), generate receipts, and see arrears and collection rates in real time.",
      featureList: [
        "Term fee invoicing",
        "Payment recording (cash, bank transfer, mobile money)",
        "Automatic receipt generation",
        "Arrears and outstanding-balance tracking",
        "Income and expense reports (P&L)",
        "Role-based access for heads, bursars and teachers",
      ],
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "35",
          priceCurrency: "USD",
          description: "Up to 50 students, billed monthly",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "50",
          priceCurrency: "USD",
          description: "Up to 250 students, billed monthly",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://schoolpurse.app/faq#faq",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default async function FaqPage() {
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
          <header>
            <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary dark:bg-primary/20">
              School fee management
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              School fees, answered.
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              {INTRO}
            </p>
            <p className="mt-4 text-[12.5px] text-muted-foreground">
              By the SchoolPurse team &middot; Founder: Kudzai Moyo &middot; Last
              updated June 2026
            </p>
          </header>

          <section
            aria-label="Key facts"
            className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
              The short version
            </h2>
            <ul className="mt-4 space-y-2.5">
              {KEY_FACTS.map((fact) => (
                <li
                  key={fact}
                  className="flex gap-3 text-[14px] leading-relaxed text-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {fact}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-14 space-y-12">
            {FAQS.map((f) => (
              <section key={f.q}>
                <h2 className="text-[20px] font-bold tracking-[-0.01em] sm:text-[22px]">
                  {f.q}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </section>
            ))}
          </div>

          <footer className="mt-16 rounded-2xl border border-border bg-muted/40 p-6">
            <p className="text-[14px] font-semibold">Still have a question?</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              Email{" "}
              <a
                href="mailto:support@schoolpurse.app"
                className="text-primary underline-offset-2 hover:underline"
              >
                support@schoolpurse.app
              </a>{" "}
              or{" "}
              <Link
                href="/#contact"
                className="text-primary underline-offset-2 hover:underline"
              >
                send us a message
              </Link>
              . Ready to start?{" "}
              <Link
                href="/login"
                className="text-primary underline-offset-2 hover:underline"
              >
                Sign in
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