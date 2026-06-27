"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { NAV_ITEMS } from "./nav-items";
import { NewChildButton } from "./new-child-button";
import { TermSelector, type TermSelectorOption } from "@/components/term-selector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type {
  ClassOption,
  RegistrationFee,
} from "./new-child-dialog";

interface TopBarProps {
  hasNotifications?: boolean;
  classes: ClassOption[];
  feeItems: RegistrationFee[];
  /**
   * ISO date of the current term's start_date. Threaded into the New
   * Registration dialog so carry-over mode can default the enrolment
   * date to the term start rather than today.
   */
  termStartDate?: string;
  /** All terms for the global term selector, newest first. */
  terms?: TermSelectorOption[];
  /** Currently-active term id (drives the selector's checkmark). */
  activeTermId?: string | null;
}

function titleFromPath(pathname: string): string {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  return match?.label ?? "SchoolPurse";
}

export function TopBar({
  hasNotifications,
  classes,
  feeItems,
  termStartDate,
  terms,
  activeTermId,
}: TopBarProps) {
  const pathname = usePathname();
  const title = titleFromPath(pathname);
  // Two formats — the long one on tablet+, the short "22 May 2026" on phone
  // so the topbar doesn't wrap when stacked next to the New Registration button.
  const todayLong = React.useMemo(
    () => format(new Date(), "EEEE, d MMMM yyyy"),
    [],
  );
  const todayShort = React.useMemo(
    () => format(new Date(), "d MMM yyyy"),
    [],
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-7 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <SidebarTrigger
            className="size-8 shrink-0 rounded-lg border border-border text-muted-foreground hover:text-foreground"
          />
          <div className="min-w-0">
            <h1 className="truncate text-[16px] font-bold tracking-tight text-foreground sm:text-[17px]">
              {title}
            </h1>
            <p className="truncate text-[11px] text-muted-foreground sm:text-[11.5px]">
              <span className="sm:hidden">{todayShort}</span>
              <span className="hidden sm:inline">{todayLong}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {terms && terms.length > 0 ? (
            <TermSelector terms={terms} activeId={activeTermId ?? null} />
          ) : null}

          <NewChildButton
            classes={classes}
            feeItems={feeItems}
            termStartDate={termStartDate}
          />

          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground hover:shadow-sm"
          >
            <Bell className="size-4" />
            {hasNotifications ? (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-sp-red ring-2 ring-card" />
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
