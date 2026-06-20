"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { navSectionsForRole } from "./nav-items";
import type { UserRole } from "@/lib/supabase/types";
import { ThemeToggle } from "./theme-toggle";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

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

/**
 * The dashboard sidebar. Composed from the shadcn sidebar block primitives
 * (which give us collapse-to-icon, mobile sheet, keyboard shortcut Ctrl+B)
 * while preserving the SchoolPurse-specific content: logo, school + term,
 * nav with arrears badge, appearance toggle, user block + sign-out.
 */
export function Sidebar({
  user,
  arrearsCount = 0,
  termLabel,
  logoUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(user.name);

  return (
    <ShadcnSidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-5 py-5">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${user.schoolName ?? "School"} logo`}
                className="size-full object-contain p-0.5"
              />
            </span>
          ) : (
            <Image
              src="/logo.png"
              alt="SchoolPurse"
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-lg object-contain"
            />
          )}
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
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
          <div className="mt-3 space-y-0.5 text-[11.5px] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
            <p className="font-medium text-sidebar-foreground/80">
              {user.schoolName}
            </p>
            {termLabel ? <p>{termLabel}</p> : null}
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent className="px-1 py-3">
        {navSectionsForRole(user.role as UserRole).map((section, idx) => (
          <SidebarGroup key={section.label ?? `section-${idx}`} className="p-0">
            {section.label ? (
              <SidebarGroupLabel className="px-2 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="h-9"
                    >
                      <Link href={item.href}>
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition",
                            active
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/55",
                          )}
                          strokeWidth={1.8}
                        />
                        <span className="text-[13px] font-medium">
                          {item.label}
                        </span>
                        {item.badge === "arrears" && arrearsCount > 0 ? (
                          <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-sp-red px-1.5 py-0.5 text-[10px] font-semibold text-white group-data-[collapsible=icon]:hidden">
                            {arrearsCount}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="space-y-2 px-1 group-data-[collapsible=icon]:hidden">
          <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            Appearance
          </span>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[12.5px] font-medium text-sidebar-foreground">
              {user.name}
            </p>
            <p className="truncate text-[10.5px] text-sidebar-foreground/50">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <form
            action="/auth/logout"
            method="post"
            className="group-data-[collapsible=icon]:hidden"
          >
            <button
              type="submit"
              aria-label="Sign out"
              className="inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition hover:bg-white/[0.06] hover:text-sidebar-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>
      </SidebarFooter>

      {/* Draggable edge handle — click the border to collapse/expand,
          Notion-style. Keyboard shortcut Ctrl/Cmd+B also toggles. */}
      <SidebarRail />
    </ShadcnSidebar>
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
