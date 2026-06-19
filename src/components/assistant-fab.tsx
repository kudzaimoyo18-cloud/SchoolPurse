"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, Lock } from "lucide-react";
import { AssistantChat } from "./assistant-chat";

type Props = {
  /** First name for the greeting. */
  firstName: string;
  /** True when the school is on the AI plan. */
  hasAccess: boolean;
};

const AI_CHECKOUT = process.env.NEXT_PUBLIC_WHOP_AI_CHECKOUT;

// Floating assistant — one button on every dashboard page that opens the
// finance chat in a panel, instead of taking up a whole nav tab.
export function AssistantFab({ firstName, hasAccess }: Props) {
  const [open, setOpen] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="SchoolPurse Assistant"
          className="fixed bottom-20 right-4 z-50 flex h-[min(70vh,32rem)] w-[min(92vw,23rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:right-6 sm:bottom-24"
        >
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none">Assistant</p>
              <p className="mt-0.5 text-[11px] text-sp-text-sub">
                Fees &amp; finances, in plain words
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-md p-1 text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            {hasAccess ? (
              <AssistantChat firstName={firstName} />
            ) : (
              <UpgradePanel />
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-4 right-4 z-50 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95 sm:bottom-6 sm:right-6"
      >
        {open ? (
          <X className="size-6" strokeWidth={2.2} />
        ) : (
          <Sparkles className="size-6" strokeWidth={2} />
        )}
      </button>
    </>
  );
}

function UpgradePanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Sparkles className="size-5" strokeWidth={2} />
      </span>
      <p className="mt-3 text-sm font-semibold">Your finance assistant</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Ask &ldquo;who owes the most?&rdquo; or &ldquo;how much did we collect
        this month?&rdquo; and get an instant answer. Part of the AI plan.
      </p>
      <a
        href={AI_CHECKOUT ?? "/#pricing"}
        {...(AI_CHECKOUT ? { target: "_blank", rel: "noreferrer" } : {})}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <Lock className="size-3.5" strokeWidth={2.2} />
        Upgrade to AI
      </a>
    </div>
  );
}
