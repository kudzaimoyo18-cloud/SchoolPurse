"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { NAV_ITEMS } from "./nav-items";
import { NewChildButton } from "./new-child-button";
import type {
  ClassOption,
  RegistrationFee,
} from "./new-child-dialog";

interface TopBarProps {
  hasNotifications?: boolean;
  classes: ClassOption[];
  feeItems: RegistrationFee[];
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
}: TopBarProps) {
  const pathname = usePathname();
  const title = titleFromPath(pathname);
  const today = React.useMemo(
    () => format(new Date(), "EEEE, d MMMM yyyy"),
    [],
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="flex items-center justify-between gap-4 px-7 py-3.5">
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-[11.5px] text-muted-foreground">{today}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <NewChildButton classes={classes} feeItems={feeItems} />

          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:text-foreground"
          >
            <Bell className="size-4" />
            {hasNotifications ? (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-sp-red" />
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
