"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Animated gooey toggle — two circles morph between positions with an SVG goo
 * filter. Replaces the icon-button theme switcher. Off = light, On = dark.
 *
 * The <GooeyFilter /> SVG must be mounted somewhere in the tree (we mount it
 * once at the root layout) — without it the circles render as separate shapes
 * instead of blending into one fluid shape.
 *
 * Adapted from a stock toggle; original hardcoded a bright blue `#275EFE` and
 * a few status colors that didn't match our navy/sky palette. We rewired them
 * to the SchoolPurse tokens via CSS vars so accent overrides still work.
 */

// Tailwind v4: read a CSS variable with `bg-(--var)` parens; setting one with
// `[--var:value]` brackets still works. Mixing the two was the original bug —
// `bg-[--c-default]` was interpreted as the literal string "--c-default" and
// silently dropped, leaving the toggle track transparent.
const styles = {
  switch:
    "relative block cursor-pointer h-8 w-[52px] [--c-active-inner:#ffffff] [--c-default:rgb(203,213,225)] [--c-default-dark:rgb(148,163,184)] [transform:translateZ(0)] [backface-visibility:hidden]",
  input:
    "h-full w-full cursor-pointer appearance-none rounded-full bg-(--c-default) outline-none transition-colors duration-500 hover:bg-(--c-default-dark) [transform:translate3d(0,0,0)] data-[checked=true]:bg-(--c-background)",
  svg: "pointer-events-none absolute inset-0 fill-white [transform:translate3d(0,0,0)]",
  circle:
    "transform-gpu transition-transform duration-500 [transform:translate3d(0,0,0)] [backface-visibility:hidden]",
  dropCircle:
    "transform-gpu transition-transform duration-700 [transform:translate3d(0,0,0)]",
};

// Map "variant" → the resolved --c-background color used by the active track.
// All values are navy/sky palette so it stays on-brand.
const variantStyles: Record<string, string> = {
  default: "[--c-background:#1e3a5f] dark:[--c-background:#38bdf8]",
  accent: "[--c-background:#0ea5e9]",
  success: "[--c-background:#16a34a]",
  warning: "[--c-background:#d97706]",
  danger: "[--c-background:#dc2626]",
};

interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  variant?: keyof typeof variantStyles;
  "aria-label"?: string;
}

export function GooeyToggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  className,
  variant = "default",
  ...rest
}: ToggleProps) {
  // Controlled if `checked` provided, otherwise uncontrolled.
  const [internal, setInternal] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internal;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <label className={cn(styles.switch, className)}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        data-checked={isChecked}
        className={cn(styles.input, variantStyles[variant])}
        aria-label={rest["aria-label"]}
      />
      <svg viewBox="0 0 52 32" filter="url(#sp-goo)" className={styles.svg}>
        <circle
          className={styles.circle}
          cx="16"
          cy="16"
          r="10"
          style={{
            transformOrigin: "16px 16px",
            transform: `translateX(${isChecked ? "12px" : "0px"}) scale(${
              isChecked ? "0" : "1"
            })`,
          }}
        />
        <circle
          className={styles.circle}
          cx="36"
          cy="16"
          r="10"
          style={{
            transformOrigin: "36px 16px",
            transform: `translateX(${isChecked ? "0px" : "-12px"}) scale(${
              isChecked ? "1" : "0"
            })`,
          }}
        />
        {isChecked && (
          <circle className={styles.dropCircle} cx="35" cy="-1" r="2.5" />
        )}
      </svg>
    </label>
  );
}

/**
 * Mount this once at the root of the app (we put it in `layout.tsx`) so the
 * <filter id="sp-goo"> referenced by GooeyToggle's SVG is always in the DOM.
 */
export function GooeyFilter() {
  return (
    <svg className="fixed h-0 w-0" aria-hidden focusable="false">
      <defs>
        <filter id="sp-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
