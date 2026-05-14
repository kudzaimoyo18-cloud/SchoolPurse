import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

const VARIANTS: Record<NonNullable<StatusBadgeProps["variant"]>, string> = {
  default: "bg-accent text-accent-foreground",
  success: "bg-sp-green-soft text-sp-green",
  warning: "bg-sp-amber-soft text-sp-amber",
  danger: "bg-sp-red-soft text-sp-red",
  neutral: "bg-sp-card-alt text-sp-text-sub",
};

export function StatusBadge({
  label,
  variant = "default",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
        VARIANTS[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}

/**
 * Map days-overdue to a status badge per the design handoff:
 *   ≤ 30 days  → green (recent)
 *   31–60 days → amber (moderate)
 *   > 60 days  → red (critical)
 */
export function ArrearsStatusBadge({ daysOverdue }: { daysOverdue: number }) {
  if (daysOverdue > 60) {
    return <StatusBadge label="Critical" variant="danger" />;
  }
  if (daysOverdue > 30) {
    return <StatusBadge label="Moderate" variant="warning" />;
  }
  return <StatusBadge label="Recent" variant="success" />;
}
