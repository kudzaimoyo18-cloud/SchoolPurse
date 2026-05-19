"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicesForCurrentTerm } from "./actions";

export function GenerateInvoicesButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    if (
      !confirm(
        "Generate invoices for all active students for the current term? Students who already have a term invoice will be skipped.",
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
          description: `Skipped: ${res.skipped}. Likely all students already have term invoices.`,
        });
      } else {
        toast.success(
          `Created ${res.invoices} invoice${res.invoices === 1 ? "" : "s"} (skipped ${res.skipped})`,
        );
      }
      router.refresh();
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileText className="size-4" />
      )}
      Generate term invoices
    </Button>
  );
}
