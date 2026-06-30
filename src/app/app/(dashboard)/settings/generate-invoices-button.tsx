"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicesForTerm } from "./actions";

interface TermOption {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export function GenerateInvoicesButton({
  terms,
  defaultTermId,
}: {
  terms: TermOption[];
  defaultTermId: string | null;
}) {
  const router = useRouter();
  const [termId, setTermId] = React.useState(
    defaultTermId ?? terms[0]?.id ?? "",
  );
  const [pending, startTransition] = React.useTransition();

  const selected = terms.find((t) => t.id === termId) ?? null;

  function handleClick() {
    if (!selected) {
      toast.error("Pick a term first.");
      return;
    }
    if (
      !confirm(
        `Generate invoices for all active students for ${selected.name} (${selected.start_date} → ${selected.end_date})? Students who already have an invoice for this term are skipped.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await generateInvoicesForTerm(termId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.invoices === 0) {
        toast.message("No new invoices created", {
          description: `Skipped: ${res.skipped}. Likely all students already have an invoice for ${selected.name}.`,
        });
      } else {
        toast.success(
          `Created ${res.invoices} invoice${res.invoices === 1 ? "" : "s"} for ${selected.name} (skipped ${res.skipped})`,
        );
      }
      router.refresh();
    });
  }

  if (terms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Set your term dates above first, then generate invoices.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="generate-term" className="sr-only">
        Term to generate invoices for
      </label>
      <select
        id="generate-term"
        value={termId}
        onChange={(e) => setTermId(e.target.value)}
        disabled={pending}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      >
        {terms.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.is_current ? " (current)" : ""}
          </option>
        ))}
      </select>
      <Button onClick={handleClick} disabled={pending || !termId}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        Generate term invoices
      </Button>
    </div>
  );
}
