import Image from "next/image";
import { Banknote, MapPin, WifiOff } from "lucide-react";

const LOCAL_NOTES = [
  {
    icon: Banknote,
    title: "Cash-first, in your office",
    body:
      "Most parents still settle fees at the bursar's window. SchoolPurse is built around that — record the cash, hand over a receipt, done.",
  },
  {
    icon: MapPin,
    title: "USD-priced by default",
    body:
      "Fees stay in USD so they don't drift with the ZWG. Multi-currency support is on the roadmap, but USD-only handles most schools here.",
  },
  {
    icon: WifiOff,
    title: "Tolerant of patchy internet",
    body:
      "Pages stay usable on slow connections. CSV exports and printable receipts keep working offline once the page is loaded.",
  },
];

export function LocalContext() {
  return (
    <section className="relative border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.05fr]">
          {/* Copy column */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
              <Image
                src="/marketing/zimbabwe-flag.svg"
                alt="Flag of Zimbabwe"
                width={20}
                height={12}
                className="size-auto rounded-sm border border-border/40"
              />
              Zimbabwe-first
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for our schools, with our schools
            </h2>

            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              We&apos;re working out of Harare. We know how Zimbabwean schools
              actually run — fees invoiced in USD, parents queuing at the
              bursar&apos;s window, terms broken up by sports day and
              prizegiving, and a WhatsApp group for everything.
            </p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
              SchoolPurse fits into that rhythm. No payment gateway you have
              to register for. No bank integration to wait six weeks for. Just
              a clean ledger your bursar can use the day you sign in.
            </p>

            <ul className="mt-8 space-y-4">
              {LOCAL_NOTES.map((note) => {
                const Icon = note.icon;
                return (
                  <li key={note.title} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                      <Icon className="size-4" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold tracking-tight">
                        {note.title}
                      </p>
                      <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                        {note.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Photo collage column */}
          <div className="grid grid-cols-6 grid-rows-6 gap-3">
            <figure className="col-span-4 row-span-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/marketing/classroom-linstedt.jpg"
                  alt="Pupils sitting in a classroom in Lagos, Nigeria — Photo by Doug Linstedt on Unsplash"
                  fill
                  sizes="(min-width: 1024px) 480px, (min-width: 640px) 60vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </figure>
            <figure className="col-span-2 row-span-3 col-start-5 row-start-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/marketing/uniform-balogun.jpg"
                  alt="A schoolboy in a green and white uniform — Photo by Abubakar Balogun on Unsplash"
                  fill
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 50vw"
                  className="object-cover"
                />
              </div>
            </figure>
            <figure className="col-span-2 row-span-3 col-start-5 row-start-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/marketing/students-table-montenegro.jpg"
                  alt="A group of young students sitting at a table in Wakiso, Uganda — Photo by Felicia Montenegro on Unsplash"
                  fill
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 50vw"
                  className="object-cover"
                />
              </div>
            </figure>
            <figure className="col-span-4 row-span-2 col-start-1 row-start-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[16/9]">
                <Image
                  src="/marketing/students-window-wegener.jpg"
                  alt="A group of young children standing in a window — Photo by bill wegener on Unsplash"
                  fill
                  sizes="(min-width: 1024px) 480px, (min-width: 640px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            </figure>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          Photos by Doug Linstedt, Abubakar Balogun, Felicia Montenegro &amp;
          bill wegener on Unsplash. Flag of Zimbabwe via Wikimedia Commons
          (public domain).
        </p>
      </div>
    </section>
  );
}
