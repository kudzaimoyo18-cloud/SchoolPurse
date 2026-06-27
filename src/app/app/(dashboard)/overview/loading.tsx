import { Skeleton } from "@/components/ui/skeleton";
import {
  KpiRowSkeleton,
  SectionCardSkeleton,
} from "@/components/skeletons";

// Tailored skeleton for the overview: KPI row, charts row, then the two
// bottom section cards — mirrors page.tsx so the layout doesn't shift when
// the (multi-wave) data load resolves.
export default function OverviewLoading() {
  return (
    <div className="space-y-6">
      <KpiRowSkeleton />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-[220px] w-full rounded-lg" />
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mx-auto mt-4 size-[160px] rounded-full" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </section>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <SectionCardSkeleton rows={5} />
        <SectionCardSkeleton rows={6} />
      </div>
    </div>
  );
}
