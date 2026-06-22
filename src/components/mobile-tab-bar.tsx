"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  AlertTriangle,
  Users,
  CalendarCheck,
  GraduationCap,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/types";

// Android-first bottom navigation: a fixed, thumb-reachable bar of the few key
// destinations, with "More" opening the full sidebar sheet. Mobile only
// (lg:hidden) — desktop keeps the sidebar.

type Tab = { href: string; label: string; icon: LucideIcon; badge?: boolean };

function tabsForRole(role: UserRole, arrearsCount: number): Tab[] {
  const isFinance =
    role === "platform_admin" || role === "school_admin" || role === "bursar";

  if (isFinance) {
    return [
      { href: "/app/overview", label: "Home", icon: Home },
      { href: "/app/payments", label: "Payments", icon: CreditCard },
      {
        href: "/app/arrears",
        label: "Arrears",
        icon: AlertTriangle,
        badge: arrearsCount > 0,
      },
      { href: "/app/students", label: "Students", icon: Users },
    ];
  }
  // Teachers + other staff.
  return [
    { href: "/app/overview", label: "Home", icon: Home },
    { href: "/app/students", label: "Students", icon: Users },
    { href: "/app/attendance", label: "Register", icon: CalendarCheck },
    { href: "/app/report-cards", label: "Reports", icon: GraduationCap },
  ];
}

export function MobileTabBar({
  role,
  arrearsCount = 0,
}: {
  role: UserRole;
  arrearsCount?: number;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const tabs = tabsForRole(role, arrearsCount);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const active =
          pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.9} />
              {t.badge ? (
                <span className="absolute -right-1.5 -top-0.5 size-2 rounded-full bg-sp-red ring-2 ring-card" />
              ) : null}
            </span>
            {t.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition"
      >
        <Menu className="size-5" strokeWidth={1.9} />
        More
      </button>
    </nav>
  );
}
