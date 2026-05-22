import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" };
  icon?: LucideIcon;
  variant?: "default" | "danger";
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  variant = "default",
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md sm:p-5",
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
        variant === "danger" ? "before:bg-sp-red" : "before:bg-primary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
          {label}
        </p>
        {Icon ? (
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] dark:bg-primary/15">
            <Icon className="size-4 text-primary" strokeWidth={1.8} />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-[22px] font-bold leading-tight tracking-[-0.02em] sm:text-[26px]",
          variant === "danger" ? "text-sp-red" : "text-foreground",
        )}
      >
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-2 text-[11.5px]">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
              trend.direction === "up"
                ? "bg-sp-green-soft text-sp-green"
                : "bg-sp-red-soft text-sp-red",
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend.value}
          </span>
        ) : null}
        {hint ? <span className="text-sp-text-sub">{hint}</span> : null}
      </div>
    </div>
  );
}
