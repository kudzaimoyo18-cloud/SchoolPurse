"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePlus2, Loader2 } from "lucide-react";
import { generateInvoicesForCurrentTerm } from "@/app/app/(dashboard)/settings/actions";

/**
 * Topbar shortcut that calls the same `generateInvoicesForCurrentTerm` server
 * action the Settings page uses. Sits next to "New Registration" so a bursar
 * doesn't have to navigate to Settings every term to bill students.
 *
 * Visual hierarchy: outline-style on purpose so it stays clearly secondary to
 * the primary navy "New Registration" CTA. Mobile shrinks the label to
 * "Invoice" so the topbar doesn't wrap on phone — matches the NewChildButton
 * pattern we already use for the sibling button.
 */
export function CreateInvoiceButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    if (
      !confirm(
        "Generate invoices for all active students for the current term?\n\nStudents who already have a term invoice will be skipped.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await generateInvoicesForCurrentTerm();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.invoices === 0) {
        toast.message("No new invoices created", {
          description:
            res.skipped > 0
              ? `Skipped ${res.skipped} — likely already invoiced for this term.`
              : "Nothing to bill — check your fee items and term setup.",
        });
      } else {
        toast.success(
          `Created ${res.invoices} invoice${res.invoices === 1 ? "" : "s"}`,
          {
            description:
              res.skipped > 0
                ? `Skipped ${res.skipped} that were already invoiced.`
                : undefined,
          },
        );
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Create term invoices"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-2 text-[12.5px] font-semibold text-foreground shadow-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
      ) : (
        <FilePlus2 className="size-3.5" strokeWidth={2.5} />
      )}
      {/* Full label on tablet+, shortened on phone so the row doesn't wrap. */}
      <span className="hidden sm:inline">
        {pending ? "Generating…" : "Create invoice"}
      </span>
      <span className="sm:hidden">{pending ? "…" : "Invoice"}</span>
    </button>
  );
}
