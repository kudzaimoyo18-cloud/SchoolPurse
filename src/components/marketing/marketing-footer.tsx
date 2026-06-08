import Link from "next/link";
import { Briefcase } from "lucide-react";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#pricing", label: "Pricing" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "#contact", label: "Contact" },
      { href: "mailto:hello@schoolpurse.app", label: "hello@schoolpurse.app" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "#contact", label: "Privacy policy" },
      { href: "#contact", label: "Terms of service" },
      { href: "#contact", label: "Data processing" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-foreground"
              aria-label="SchoolPurse home"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-4" strokeWidth={2.2} />
              </span>
              <span className="text-[15px] font-bold tracking-tight">
                School<span className="text-primary">Purse</span>
              </span>
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              Internal finance dashboards for schools in Zimbabwe — and
              anywhere else cash and arrears need to be tracked properly.
            </p>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.heading}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                {c.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") || l.href.startsWith("#") ? (
                      <Link
                        href={l.href}
                        className="text-[13px] text-muted-foreground transition hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        className="text-[13px] text-muted-foreground transition hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-muted-foreground">
            &copy; {new Date().getFullYear()} SchoolPurse. Built in Harare, for
            Zimbabwean schools.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Multi-tenant &middot; Audit-logged &middot; Made with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
