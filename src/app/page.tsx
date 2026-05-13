import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <main className="w-full max-w-xl space-y-8 text-center">
        <div className="inline-flex items-center justify-center rounded-xl bg-sidebar p-3 text-primary">
          <Briefcase className="size-7" strokeWidth={2} />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            School<span className="text-primary">Purse</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Internal finance tracking for schools — fees, arrears, expenses,
            and reports in one place.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-left text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Phase 0 — Scaffolding</p>
          <p>
            Stack ready: Next.js 16, React 19, Tailwind 4, shadcn/ui, Supabase
            SSR, TanStack Query, Recharts, Lucide, DM Sans. Auth and dashboard
            shell land in Phase 1.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Go to sign in <ArrowRight className="size-4" />
        </Link>
      </main>
    </div>
  );
}
