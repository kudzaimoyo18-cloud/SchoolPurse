import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { LEGAL } from "@/lib/legal";

/**
 * Shared shell for the legal pages (Privacy, Terms, DPA). Renders the marketing
 * nav + footer and applies uniform prose styling to the document body via
 * arbitrary-variant selectors (no typography plugin needed).
 */
export function LegalShell({
  isAuthed,
  title,
  intro,
  children,
}: {
  isAuthed: boolean;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNav isAuthed={isAuthed} />
      <main className="bg-background">
        <article
          className={[
            "mx-auto max-w-3xl px-5 py-16 sm:px-6 lg:py-24",
            "[&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground",
            "[&_h3]:mt-6 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-foreground",
            "[&_p]:mt-3 [&_p]:text-[14.5px] [&_p]:leading-relaxed [&_p]:text-muted-foreground",
            "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
            "[&_li]:text-[14.5px] [&_li]:leading-relaxed [&_li]:text-muted-foreground",
            "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
            "[&_strong]:font-semibold [&_strong]:text-foreground",
          ].join(" ")}
        >
          <header className="mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              Last updated: {LEGAL.lastUpdated}
            </p>
            {intro ? (
              <p className="mt-5 text-[14.5px] leading-relaxed text-muted-foreground">
                {intro}
              </p>
            ) : null}
          </header>

          {children}

          <div className="mt-12 rounded-xl border border-border bg-card p-5">
            <p className="!mt-0 text-[13px] leading-relaxed text-muted-foreground">
              Questions about this document? Contact us at{" "}
              <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
            </p>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
