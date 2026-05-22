"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform Admin",
  school_admin: "Head / Admin",
  bursar: "Bursar",
  teacher: "Teacher",
};

interface SidebarProps {
  user: {
    name: string;
    role: string;
    schoolName: string | null;
  };
  arrearsCount?: number;
  termLabel?: string;
  logoUrl?: string | null;
}

export function Sidebar({
  user,
  arrearsCount = 0,
  termLabel,
  logoUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(user.name);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[218px] flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo block */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <span className="inline-flex size-9 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${user.schoolName ?? "School"} logo`}
                className="size-full object-contain p-0.5"
              />
            </span>
          ) : (
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
              <Briefcase className="size-4" strokeWidth={2.2} />
            </span>
          )}
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight">
              School
              <span className="text-sidebar-primary">Purse</span>
            </p>
            <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Finance Tracker
            </p>
          </div>
        </div>
        {user.schoolName ? (
          <div className="mt-3 space-y-0.5 text-[11.5px] text-sidebar-foreground/55">
            <p className="font-medium text-sidebar-foreground/80">
              {user.schoolName}
            </p>
            {termLabel ? <p>{termLabel}</p> : null}
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/65 hover:bg-white/[0.04] hover:text-sidebar-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition",
                      active
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
                    )}
                    strokeWidth={1.8}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge === "arrears" && arrearsCount > 0 ? (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-sp-red px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {arrearsCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: theme toggle + user block */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            Appearance
          </span>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
            {initials}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12.5px] font-medium text-sidebar-foreground">
              {user.name}
            </p>
            <p className="truncate text-[10.5px] text-sidebar-foreground/50">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              aria-label="Sign out"
              className="inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition hover:bg-white/[0.06] hover:text-sidebar-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
