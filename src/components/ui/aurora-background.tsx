"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Animated aurora gradient backdrop. Used on /login and /onboarding to give
 * the auth flow a "premium product" feel without touching the rest of the app.
 *
 * Adapted from aceternity/ui — original used Tailwind v3 color CSS variables
 * (var(--blue-500) etc.) auto-injected by a Tailwind plugin. Tailwind v4
 * doesn't ship those, so we inline the colors directly. Aurora colors lean
 * on the navy/sky palette to match the rest of the design system.
 */
interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-svh flex-col items-center justify-center bg-background text-foreground transition-colors",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className={cn(
            // Two stacked layers: a soft "card paper" layer + the chromatic aurora.
            // Light mode uses the white-gradient sheet on top, dark mode uses the dark-gradient.
            "absolute -inset-[10px] opacity-50 blur-[10px] will-change-transform",
            "[background-image:var(--sp-aurora-sheet-light),var(--sp-aurora-chromatic)]",
            "dark:[background-image:var(--sp-aurora-sheet-dark),var(--sp-aurora-chromatic)]",
            "[background-size:300%,200%] [background-position:50%_50%,50%_50%]",
            "invert dark:invert-0",
            // The pseudo element does the actual animation so the parent stays cheap to repaint.
            "after:absolute after:inset-0 after:content-['']",
            "after:[background-image:var(--sp-aurora-sheet-light),var(--sp-aurora-chromatic)]",
            "after:dark:[background-image:var(--sp-aurora-sheet-dark),var(--sp-aurora-chromatic)]",
            "after:[background-size:200%,100%] after:[background-attachment:fixed]",
            "after:mix-blend-difference after:animate-aurora",
            showRadialGradient &&
              "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]",
          )}
        />
      </div>
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
