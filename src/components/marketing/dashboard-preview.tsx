import {
  Briefcase,
  Home,
  CreditCard,
  AlertTriangle,
  Users,
  FileText,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  Bell,
  Plus,
} from "lucide-react";

/**
 * Static, decorative recreation of the SchoolPurse dashboard for the
 * marketing hero. Doesn't fetch anything — uses representative numbers
 * so the visual matches the real product without needing a screenshot.
 */
export function DashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/[0.08] dark:shadow-black/40">
      <div className="grid grid-cols-[140px_1fr]">
        {/* Sidebar */}
        <div className="flex flex-col bg-sidebar px-2.5 py-3 text-sidebar-foreground">
          <div className="mb-3 flex items-center gap-1.5 px-1.5">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary">
              <Briefcase className="size-3" strokeWidth={2.2} />
            </span>
            <span className="text-[10px] font-semibold tracking-tight text-sidebar-foreground">
              School<span className="text-sidebar-primary">Purse</span>
            </span>
          </div>
          <ul className="space-y-0.5">
            {[
              { icon: Home, label: "Overview", active: true },
              { icon: CreditCard, label: "Payments" },
              { icon: AlertTriangle, label: "Arrears", badge: 12 },
              { icon: Users, label: "Students" },
              { icon: FileText, label: "Expenses" },
              { icon: BarChart3, label: "Reports" },
              { icon: Settings, label: "Settings" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[9.5px] ${
                    item.active
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/70"
                  }`}
                >
                  <Icon
                    className={`size-2.5 ${item.active ? "text-sidebar-primary" : ""}`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-sp-red px-1 text-[8px] font-semibold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Content */}
        <div className="flex min-h-[300px] flex-col bg-background">
          {/* Topbar */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div>
              <p className="text-[10.5px] font-bold tracking-tight">Overview</p>
              <p className="text-[8px] text-muted-foreground">Today</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[8px] font-semibold text-primary-foreground">
                <Plus className="size-2.5" />
                Quick Payment
              </span>
              <span className="relative inline-flex size-5 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                <Bell className="size-2.5" />
                <span className="absolute right-1 top-1 size-1 rounded-full bg-sp-red" />
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-1.5 px-3 py-2.5">
            {[
              {
                label: "TODAY",
                value: "$1,240",
                trend: { dir: "up" as const, val: "12%" },
              },
              {
                label: "MONTH",
                value: "$48.2K",
                trend: { dir: "up" as const, val: "8%" },
              },
              {
                label: "OUTSTANDING",
                value: "$5.4K",
                danger: true,
                hint: "12 in arrears",
              },
              {
                label: "NET",
                value: "$32.1K",
              },
            ].map((k) => (
              <div
                key={k.label}
                className="relative rounded-md border border-border bg-card p-1.5 pl-2"
              >
                <span
                  className={`absolute inset-y-0 left-0 w-[2px] rounded-l-md ${k.danger ? "bg-sp-red" : "bg-primary"}`}
                />
                <p className="text-[7px] font-semibold uppercase tracking-wider text-sp-text-sub">
                  {k.label}
                </p>
                <p
                  className={`text-[12px] font-bold leading-tight tabular-nums ${k.danger ? "text-sp-red" : ""}`}
                >
                  {k.value}
                </p>
                {k.trend ? (
                  <span
                    className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1 py-px text-[7px] font-semibold ${
                      k.trend.dir === "up"
                        ? "bg-sp-green-soft text-sp-green"
                        : "bg-sp-red-soft text-sp-red"
                    }`}
                  >
                    {k.trend.dir === "up" ? (
                      <TrendingUp className="size-2" />
                    ) : (
                      <TrendingDown className="size-2" />
                    )}
                    {k.trend.val}
                  </span>
                ) : null}
                {k.hint ? (
                  <p className="text-[7px] text-muted-foreground">{k.hint}</p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Chart placeholder */}
          <div className="mx-3 mb-3 flex-1 rounded-md border border-border bg-card p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[8px] font-semibold">Income vs Expenses</p>
              <p className="text-[7px] text-muted-foreground">6 months</p>
            </div>
            <div className="flex h-[80px] items-end gap-2 px-1">
              {[60, 75, 50, 85, 95, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex flex-1 items-end gap-0.5"
                  aria-hidden
                >
                  <div
                    className="flex-1 rounded-t bg-primary"
                    style={{ height: `${h}%` }}
                  />
                  <div
                    className="flex-1 rounded-t bg-sp-muted/50"
                    style={{ height: `${h * 0.55}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-3 text-[7px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-sm bg-primary" />
                Income
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-sm bg-sp-muted/50" />
                Expenses
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
