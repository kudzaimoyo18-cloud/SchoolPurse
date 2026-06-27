import Image from "next/image";
import { Handshake } from "lucide-react";

// Official partners shown on the landing page. Drop the logo files into
// /public/marketing with the `src` names below. Add more entries here and the
// grid reflows automatically.
const PARTNERS = [
  {
    name: "Zimbabwe Early Childhood Development & Education Foundation",
    short: "ZEChiDEF Institute",
    src: "/marketing/partner-zechidef.png",
    // Wide lockup — give it a little more room than the square mark.
    width: 320,
    height: 120,
  },
  {
    name: "Twinkle Star Junior School",
    short: "Twinkle Star Junior School",
    src: "/marketing/partner-twinkle-star.png",
    width: 140,
    height: 120,
  },
];

export function Partners() {
  return (
    <section
      id="partners"
      className="relative border-t border-border bg-card/40"
      aria-labelledby="partners-heading"
    >
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground shadow-sm">
            <Handshake className="size-3.5 text-primary" strokeWidth={2} />
            Our partners
          </span>

          <h2
            id="partners-heading"
            className="mt-5 text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
          >
            Working with the people who run schools
          </h2>

          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            We build SchoolPurse alongside educators and institutions on the
            ground in Zimbabwe &mdash; so the product fits how schools here
            actually run.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PARTNERS.map((partner) => (
            <li key={partner.name}>
              <div className="group flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                {/* Logos sit on a white chip so they stay crisp in dark mode
                    (and against the light card in light mode) regardless of
                    whether the source PNG is transparent or white-backed. */}
                <div className="flex h-24 items-center justify-center rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-black/5">
                  <Image
                    src={partner.src}
                    alt={`${partner.short} logo`}
                    width={partner.width}
                    height={partner.height}
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <p className="text-[13.5px] font-semibold tracking-tight text-foreground">
                  {partner.short}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
