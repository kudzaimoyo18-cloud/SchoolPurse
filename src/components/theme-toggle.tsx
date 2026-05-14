"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * Sidebar appearance toolbar: light/dark icon toggle + 3 inline accent swatches.
 * Persists both to localStorage.
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
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      // ignore storage errors (private mode etc.)
    }
  }

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {!mounted ? (
          <Sun className="size-3.5" />
        ) : isDark ? (
          <Sun className="size-3.5" />
        ) : (
          <Moon className="size-3.5" />
        )}
      </button>

      <div
        role="radiogroup"
        aria-label="Accent color"
        className="flex items-center gap-1"
      >
        {ACCENTS.map((a) => {
          const active = mounted && accent === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={a.label}
              title={a.label}
              onClick={() => chooseAccent(a.id)}
              className={cn(
                "size-4 rounded-full ring-offset-2 ring-offset-sidebar transition",
                active
                  ? "ring-2 ring-white/80"
                  : "opacity-70 hover:opacity-100",
              )}
              style={{ background: a.color }}
            />
          );
        })}
      </div>
    </div>
  );
}
