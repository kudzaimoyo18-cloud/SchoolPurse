"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { FeeItemDialog } from "./fee-item-dialog";
import { toggleFeeItem } from "./actions";

interface ClassOption {
  id: string;
  name: string;
}

interface FeeItem {
  id: string;
  name: string;
  type: string;
  amount_usd: number;
  recurrence: "per_term" | "per_month" | "one_off";
  applicable_class_ids: string[];
  active: boolean;
  include_on_registration: boolean;
}

const RECURRENCE_LABELS: Record<FeeItem["recurrence"], string> = {
  per_term: "Per term",
  per_month: "Per month",
  one_off: "One-off",
};

export function FeeItemsSection({
  feeItems,
  classes,
}: {
  feeItems: FeeItem[];
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [openNew, setOpenNew] = React.useState(false);
  const [editing, setEditing] = React.useState<FeeItem | null>(null);
  const [pending, startTransition] = React.useTransition();

  const classNameOf = React.useCallback(
    (ids: string[]) => {
      if (!ids?.length) return "All students";
      return ids
        .map((id) => classes.find((c) => c.id === id)?.name)
        .filter(Boolean)
        .join(", ");
    },
    [classes],
  );

  function toggle(item: FeeItem) {
    startTransition(async () => {
      const res = await toggleFeeItem(item.id, !item.active);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(item.active ? "Fee item deactivated" : "Fee item activated");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <h2 className="text-[14.5px] font-semibold leading-tight">
            Fee structure
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Each fee item is a line on the invoice. Inactive items aren&apos;t billed.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpenNew(true)}>
          <Plus className="size-3.5" />
          New fee item
        </Button>
      </div>

      {feeItems.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          No fee items yet. Create one to start invoicing.
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-sp-card-alt">
            <TableRow>
              <TableHead className="pl-5">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applies to</TableHead>
              <TableHead>Recurrence</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feeItems.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="pl-5 font-medium">{f.name}</TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {f.type}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {classNameOf(f.applicable_class_ids)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {RECURRENCE_LABELS[f.recurrence]}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(f.amount_usd)}
                </TableCell>
                <TableCell>
                  {f.active ? (
                    <StatusBadge label="Active" variant="success" />
                  ) : (
                    <StatusBadge label="Inactive" variant="neutral" />
                  )}
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(f)}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(f)}
                      disabled={pending}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground disabled:opacity-50"
                      aria-label={f.active ? "Deactivate" : "Activate"}
                    >
                      <Power className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <FeeItemDialog
        open={openNew}
        onOpenChange={setOpenNew}
        classes={classes}
      />
      <FeeItemDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        classes={classes}
        initial={editing}
      />
    </>
  );
}
