import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared loading skeletons for route-level `loading.tsx` files.
 *
 * Every dashboard page is dynamically rendered (auth + per-request Supabase
 * queries), so without a Suspense boundary a navigation blocks on the full
 * server render before anything paints. These skeletons give an instant
 * structural placeholder on click so page-to-page navigation feels immediate.
 * Shapes deliberately mirror the real screens (KPI row, section card, table)
 * to avoid a layout jump when the data arrives.
 */

/** A titled card shell matching <SectionCard>. */
export function SectionCardSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </header>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1 max-w-[40%]" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Row of KPI cards (overview-style). */
export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Generic toolbar (search + button) placeholder above a list. */
export function ToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-9 w-full max-w-xs rounded-md" />
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  );
}

/**
 * Default list-page skeleton: a toolbar plus a section card with rows.
 * Used by the dashboard segment fallback that covers every table screen.
 */
export function ListPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <ToolbarSkeleton />
      <SectionCardSkeleton rows={rows} />
    </div>
  );
}
