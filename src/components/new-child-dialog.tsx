"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
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
import { formatMoney, toNumber } from "@/lib/format";
import { enrollChild } from "@/app/(dashboard)/students/enroll-action";

export interface ClassOption {
  id: string;
  name: string;
}

export interface RegistrationFee {
  id: string;
  name: string;
  type: string;
  amount_usd: number;
  applicable_class_ids: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: ClassOption[];
  feeItems: RegistrationFee[];
}

export function NewChildDialog({
  open,
  onOpenChange,
  classes,
  feeItems,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [classId, setClassId] = React.useState<string>("");
  const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(
    new Set(),
  );

  // Compute the applicable bundle from the school's fee_items based on the
  // selected class. Pre-checks them when the class changes.
  const applicableItems = React.useMemo(() => {
    return feeItems.filter((f) => {
      if (f.applicable_class_ids.length === 0) return true; // global
      if (!classId) return false;
      return f.applicable_class_ids.includes(classId);
    });
  }, [feeItems, classId]);

  React.useEffect(() => {
    // Whenever the applicable set changes, default-check all items.
    setSelectedItemIds(new Set(applicableItems.map((f) => f.id)));
  }, [applicableItems]);

  const total = React.useMemo(
    () =>
      applicableItems
        .filter((f) => selectedItemIds.has(f.id))
        .reduce((sum, f) => sum + toNumber(f.amount_usd), 0),
    [applicableItems, selectedItemIds],
  );

  function toggleItem(id: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setClassId("");
    setSelectedItemIds(new Set());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Reset and re-set fee_item_ids based on our state (FormData would
    // include all checkboxes even un-rendered ones).
    formData.delete("fee_item_ids");
    for (const id of selectedItemIds) {
      if (applicableItems.some((f) => f.id === id)) {
        formData.append("fee_item_ids", id);
      }
    }

    startTransition(async () => {
      const res = await enrollChild(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const name = String(formData.get("first_name") ?? "").trim();
      toast.success(
        res.invoiceId
          ? `${name} enrolled — ${formatMoney(res.total)} invoice created`
          : `${name} enrolled (no fees billed yet)`,
      );
      reset();
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Enrol a new child
          </DialogTitle>
          <DialogDescription>
            Enrol the student and bill the school&apos;s registration bundle in
            one step. Uncheck any items you want to waive for this child.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                name="first_name"
                required
                disabled={pending}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                name="last_name"
                required
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="class_id">Class</Label>
              <select
                id="class_id"
                name="class_id"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={pending}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— No class —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                disabled={pending}
                defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enrollment_date">Enrollment date</Label>
            <Input
              id="enrollment_date"
              name="enrollment_date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              disabled={pending}
              className="sm:w-1/2"
            />
          </div>

          {/* Registration bundle */}
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-sp-card-alt px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold">Registration bundle</p>
                <p className="text-[11px] text-muted-foreground">
                  Fees marked &quot;include on registration&quot; in Settings.
                  Pick a class to see class-specific items.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  Opening balance
                </p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {formatMoney(total)}
                </p>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto p-2">
              {applicableItems.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {feeItems.length === 0
                    ? "No fee items configured yet. Set them up in Settings → Fee structure."
                    : classId
                      ? "No registration-flagged items apply to this class."
                      : "Pick a class to see applicable items, or leave class blank for global-only items."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {applicableItems.map((f) => {
                    const checked = selectedItemIds.has(f.id);
                    return (
                      <li key={f.id}>
                        <label
                          className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-sp-card-alt"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(f.id)}
                            disabled={pending}
                            className="size-4"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{f.name}</p>
                            <p className="text-[11px] capitalize text-muted-foreground">
                              {f.type}
                            </p>
                          </div>
                          <p className="font-semibold tabular-nums">
                            {formatMoney(f.amount_usd)}
                          </p>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Enrol & invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
