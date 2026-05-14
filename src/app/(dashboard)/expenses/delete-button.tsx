"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "./actions";

export function DeleteExpenseButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    if (!confirm("Delete this expense?")) return;
    startTransition(async () => {
      const res = await deleteExpense(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Expense deleted");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Delete expense"
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-red-soft hover:text-sp-red disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
