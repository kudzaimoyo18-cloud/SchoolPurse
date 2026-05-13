"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACCENTS = [
  { id: "green", label: "SchoolPurse Green", color: "#22c27a" },
  { id: "blue", label: "SchoolPurse Blue", color: "#3b82f6" },
  { id: "amber", label: "Warm Amber", color: "#f59e0b" },
] as const;

type AccentId = (typeof ACCENTS)[number]["id"];

const ACCENT_STORAGE_KEY = "schoolpurse.accent";

function readAccent(): AccentId {
  if (typeof window === "undefined") return "green";
  const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  if (stored === "blue" || stored === "amber" || stored === "green") {
    return stored;
  }
  return "green";
}

function applyAccent(accent: AccentId) {
  const html = document.documentElement;
  if (accent === "green") {
    html.removeAttribute("data-accent");
  } else {
    html.setAttribute("data-accent", accent);
  }
}

/**
 * Two-button toolbar in the sidebar footer: a light/dark icon toggle and
 * a palette dropdown for the accent color. Persists both to localStorage.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [accent, setAccent] = React.useState<AccentId>("green");

  React.useEffect(() => {
    setMounted(true);
    const a = readAccent();
    setAccent(a);
    applyAccent(a);
  }, []);

  function chooseAccent(next: AccentId) {
    setAccent(next);
    applyAccent(next);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
  }

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="inline-flex size-9 items-center justify-center rounded-md text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {!mounted ? (
          <Sun className="size-4" />
        ) : isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Choose accent color"
          className="inline-flex size-9 items-center justify-center rounded-md text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Palette className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-52">
          <DropdownMenuLabel>Accent color</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ACCENTS.map((a) => {
            const active = accent === a.id;
            return (
              <DropdownMenuItem
                key={a.id}
                onSelect={() => chooseAccent(a.id)}
                className={cn(active && "font-medium")}
              >
                <span
                  className="size-3 rounded-full"
                  style={{ background: a.color }}
                />
                <span className="flex-1">{a.label}</span>
                {active ? <Check className="size-4" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
