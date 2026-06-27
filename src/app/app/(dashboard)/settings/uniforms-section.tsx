"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Power, Loader2, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createFeeItem, toggleFeeItem } from "./actions";

interface ClassOption {
  id: string;
  name: string;
}

interface UniformItem {
  id: string;
  name: string;
  type: string;
  amount_usd: number;
  recurrence: "per_term" | "per_month" | "one_off";
  applicable_class_ids: string[];
  active: boolean;
  include_on_registration: boolean;
}

export function UniformsSection({
  uniforms,
  classes,
}: {
  uniforms: UniformItem[];
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<UniformItem | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    // Pre-fill uniform-specific defaults
    formData.set("type", "uniform");
    formData.set("recurrence", "one_off");
    formData.set("active", "on");

    startTransition(async () => {
      const res = await createFeeItem(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Uniform item added");
      form.reset();
      setShowForm(false);
      router.refresh();
    });
  }

  function toggle(item: UniformItem) {
    startTransition(async () => {
      const res = await toggleFeeItem(item.id, !item.active);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        item.active ? "Uniform item deactivated" : "Uniform item activated",
      );
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-sp-card-alt">
            <Shirt className="size-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-[14.5px] font-semibold leading-tight">
              Uniforms
            </h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Define uniform items and prices. These appear on student invoices
              when generated.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="size-3.5" />
          Add uniform
        </Button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-3 border-b border-border bg-sp-card-alt/50 px-5 py-3.5"
        >
          <div className="min-w-[180px] flex-1 space-y-1">
            <Label htmlFor="uniform-name" className="text-xs">
              Uniform item
            </Label>
            <Input
              id="uniform-name"
              name="name"
              required
              disabled={pending}
              placeholder="e.g. Blazer, Tie, Shirt"
              className="h-8 text-sm"
            />
          </div>
          <div className="w-[120px] space-y-1">
            <Label htmlFor="uniform-amount" className="text-xs">
              Amount (USD)
            </Label>
            <Input
              id="uniform-amount"
              name="amount_usd"
              type="number"
              step="0.01"
              min="0"
              required
              disabled={pending}
              placeholder="0.00"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {uniforms.length === 0 && !showForm ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          No uniform items yet. Add one to include it on student invoices.
        </div>
      ) : uniforms.length > 0 ? (
        <>
        {/* Mobile: stacked uniform cards instead of a side-scrolling table. */}
        <ul className="divide-y divide-border md:hidden">
          {uniforms.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <div className="mt-1">
                  {u.active ? (
                    <StatusBadge label="Active" variant="success" />
                  ) : (
                    <StatusBadge label="Inactive" variant="neutral" />
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium tabular-nums">
                  {formatMoney(u.amount_usd)}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(u)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggle(u)}
                  disabled={pending}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground disabled:opacity-50"
                  aria-label={u.active ? "Deactivate" : "Activate"}
                >
                  <Power className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop: the full table. */}
        <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader className="bg-sp-card-alt">
            <TableRow>
              <TableHead className="pl-5">Item</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uniforms.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="pl-5 font-medium">{u.name}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(u.amount_usd)}
                </TableCell>
                <TableCell>
                  {u.active ? (
                    <StatusBadge label="Active" variant="success" />
                  ) : (
                    <StatusBadge label="Inactive" variant="neutral" />
                  )}
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(u)}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(u)}
                      disabled={pending}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground disabled:opacity-50"
                      aria-label={u.active ? "Deactivate" : "Activate"}
                    >
                      <Power className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </>
      ) : null}

      {/* Reuse full dialog for editing */}
      <FeeItemDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        classes={classes}
        initial={editing}
      />
    </>
  );
}
