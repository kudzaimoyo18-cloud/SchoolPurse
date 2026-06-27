"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TermSelectorOption {
  id: string;
  name: string;
  year: string | null;
  is_current: boolean;
}

/**
 * Global term picker shown in the topbar. Writes the chosen term id to the
 * `sp_term` cookie (the server resolves it in lib/queries/term.ts) and refreshes
 * so every server-rendered finance view re-reads it. Cookie name is inlined
 * because the server module that owns it pulls in next/headers.
 */
export function TermSelector({
  terms,
  activeId,
}: {
  terms: TermSelectorOption[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (terms.length === 0) return null;

  const active = terms.find((t) => t.id === activeId) ?? null;

  function select(id: string) {
    if (id === activeId) return;
    document.cookie = `sp_term=${id}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select term"
        data-pending={pending ? "" : undefined}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground data-[pending]:opacity-60"
      >
        <CalendarDays className="size-3.5" />
        <span className="hidden max-w-[10rem] truncate sm:inline">
          {active ? active.name : "Term"}
        </span>
        <ChevronsUpDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuLabel>Viewing term</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {terms.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => select(t.id)}
            className="flex items-center justify-between gap-3"
          >
            <span className="min-w-0 truncate">
              {t.name}
              {t.year ? (
                <span className="text-muted-foreground"> · {t.year}</span>
              ) : null}
              {t.is_current ? (
                <span className="text-muted-foreground"> (current)</span>
              ) : null}
            </span>
            {t.id === activeId ? (
              <Check className="size-3.5 shrink-0 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
