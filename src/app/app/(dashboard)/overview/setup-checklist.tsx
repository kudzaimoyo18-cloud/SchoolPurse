"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Circle, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SetupStep {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

const STORAGE_KEY = "schoolpurse.setupChecklist.dismissed";
const EVENT = "schoolpurse:checklist";

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  // localStorage is an external store — read it via useSyncExternalStore so we
  // stay concurrent-safe and avoid hydration mismatch (server snapshot = hidden).
  const dismissed = React.useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY) === "1",
    () => true,
  );

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Once everything is done, persist dismissal (no setState — external write only).
  React.useEffect(() => {
    if (allDone) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new Event(EVENT));
    }
  }, [allDone]);

  if (allDone || dismissed) return null;

  function handleDismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-5 shadow-sm">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss setup guide"
        className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </span>
        <h2 className="text-[15px] font-semibold tracking-tight">
          Finish setting up your school
        </h2>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {doneCount} of {steps.length} done — a few quick steps to get value out
        of SchoolPurse.
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sp-card-alt">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1.5">
        {steps.map((s) => (
          <li key={s.key}>
            <Link
              href={s.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition",
                s.done
                  ? "opacity-60"
                  : "hover:bg-card hover:shadow-sm",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                  s.done
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground",
                )}
              >
                {s.done ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  <Circle className="size-2 fill-current" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-[13.5px] font-medium",
                    s.done && "line-through",
                  )}
                >
                  {s.label}
                </span>
                <span className="block text-[11.5px] text-muted-foreground">
                  {s.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
