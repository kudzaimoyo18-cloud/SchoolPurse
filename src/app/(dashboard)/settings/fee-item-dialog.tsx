"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createFeeItem, updateFeeItem } from "./actions";

interface ClassOption {
  id: string;
  name: string;
}

interface FeeItemInitial {
  id: string;
  name: string;
  type: string;
  amount_usd: number;
  recurrence: "per_term" | "per_month" | "one_off";
  applicable_class_ids: string[];
  active: boolean;
  include_on_registration: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: ClassOption[];
  initial?: FeeItemInitial | null;
}

const FEE_TYPES = [
  { value: "tuition", label: "Tuition" },
  { value: "levy", label: "Levy" },
  { value: "sports", label: "Sports" },
  { value: "transport", label: "Transport" },
  { value: "exam", label: "Exam" },
  { value: "other", label: "Other" },
];

export function FeeItemDialog({ open, onOpenChange, classes, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const isEdit = !!initial;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = isEdit
        ? await updateFeeItem(initial!.id, formData)
        : await createFeeItem(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Fee item updated" : "Fee item created");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit fee item" : "New fee item"}</DialogTitle>
          <DialogDescription>
            Define a fee that will appear on invoices for applicable classes.
            Leave classes empty to apply to every student.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              disabled={pending}
              placeholder="e.g. Form 1 Term Fees"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                defaultValue={initial?.type ?? "tuition"}
                disabled={pending}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {FEE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurrence">Recurrence</Label>
              <select
                id="recurrence"
                name="recurrence"
                defaultValue={initial?.recurrence ?? "per_term"}
                disabled={pending}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="per_term">Per term</option>
                <option value="per_month">Per month</option>
                <option value="one_off">One-off</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount_usd">Amount (USD)</Label>
            <Input
              id="amount_usd"
              name="amount_usd"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={initial?.amount_usd ?? 0}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Applicable classes</Label>
            <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-md border border-border bg-card p-2.5">
              {classes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No classes — fee will apply to everyone.
                </p>
              ) : (
                classes.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="applicable_class_ids"
                      value={c.id}
                      defaultChecked={
                        initial?.applicable_class_ids.includes(c.id) ?? false
                      }
                      disabled={pending}
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Leave all unchecked to apply to every student.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={initial?.active ?? true}
                disabled={pending}
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="include_on_registration"
                defaultChecked={initial?.include_on_registration ?? false}
                disabled={pending}
              />
              Include on registration
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create fee item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
