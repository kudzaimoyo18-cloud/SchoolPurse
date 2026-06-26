import { ListPageSkeleton } from "@/components/skeletons";

// Segment-level fallback shown instantly on navigation to any dashboard route
// that doesn't define its own loading.tsx. Most dashboard screens are list/
// table pages, so a toolbar + table skeleton fits them all without a layout jump.
export default function DashboardLoading() {
  return <ListPageSkeleton />;
}
