"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Glassmorphic button — translucent navy fill, gradient border, inner highlight,
 * soft floating shadow. The actual visual effect lives in `globals.css` under
 * the `.glass-button-*` selectors; this component just composes them.
 *
 * Use for hero CTAs and primary moments where you want extra polish. For
 * standard dashboard buttons keep using <Button> from ./button.
 *
 * Supports `asChild` so it can host a `<Link>` (Next.js navigation) without
 * nesting a <button> inside an <a> (invalid HTML).
 */

const glassButtonVariants = cva(
  "glass-button glass-button-text relative isolate inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-full border-0 text-white outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "px-6 py-3 text-base font-semibold",
        sm: "px-4 py-2 text-sm font-medium",
        lg: "px-8 py-3.5 text-lg font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
  /** Class for the outer wrap (positioning, full-width). */
  wrapClassName?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { className, children, size, asChild = false, wrapClassName, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <div
        className={cn(
          "glass-button-wrap relative inline-block rounded-full",
          wrapClassName,
        )}
      >
        <Comp
          ref={ref}
          className={cn(glassButtonVariants({ size }), className)}
          {...props}
        >
          {children}
        </Comp>
        <div className="glass-button-shadow rounded-full" aria-hidden />
      </div>
    );
  },
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
