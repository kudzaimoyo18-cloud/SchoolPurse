"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2, Shirt, UserPlus } from "lucide-react";
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
import { enrollChild } from "@/app/app/(dashboard)/students/enroll-action";

export interface ClassOption {
  id: string;
  name: string;
  level?: "primary" | "secondary" | "tertiary";
}

const LEVEL_LABEL: Record<NonNullable<ClassOption["level"]>, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
};

const LEVEL_ORDER: Array<NonNullable<ClassOption["level"]>> = [
  "primary",
  "secondary",
  "tertiary",
];

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

/** Quantity state for uniform items: id → quantity (0 = not selected) */
type UniformQtyMap = Record<string, number>;

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
  const [uniformQty, setUniformQty] = React.useState<UniformQtyMap>({});

  // Split items: registration fees vs uniforms
  const allRegistrationFees = React.useMemo(
    () => feeItems.filter((f) => f.type !== "uniform"),
    [feeItems],
  );
  const allUniforms = React.useMemo(
    () => feeItems.filter((f) => f.type === "uniform"),
    [feeItems],
  );

  // Applicable registration fees based on class
  const applicableItems = React.useMemo(() => {
    return allRegistrationFees.filter((f) => {
      if (f.applicable_class_ids.length === 0) return true; // global
      if (!classId) return false;
      return f.applicable_class_ids.includes(classId);
    });
  }, [allRegistrationFees, classId]);

  React.useEffect(() => {
    // Whenever the applicable set changes, default-check all registration items.
    setSelectedItemIds(new Set(applicableItems.map((f) => f.id)));
  }, [applicableItems]);

  // Totals
  const feeTotal = React.useMemo(
    () =>
      applicableItems
        .filter((f) => selectedItemIds.has(f.id))
        .reduce((sum, f) => sum + toNumber(f.amount_usd), 0),
    [applicableItems, selectedItemIds],
  );

  const uniformTotal = React.useMemo(
    () =>
      allUniforms.reduce((sum, u) => {
        const qty = uniformQty[u.id] ?? 0;
        return sum + toNumber(u.amount_usd) * qty;
      }, 0),
    [allUniforms, uniformQty],
  );

  const total = feeTotal + uniformTotal;

  function toggleItem(id: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setQty(id: string, qty: number) {
    setUniformQty((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  function toggleUniform(id: string) {
    setUniformQty((prev) => {
      const current = prev[id] ?? 0;
      return { ...prev, [id]: current > 0 ? 0 : 1 };
    });
  }

  function reset() {
    setClassId("");
    setSelectedItemIds(new Set());
    setUniformQty({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Set fee_item_ids from registration fee checkboxes
    formData.delete("fee_item_ids");
    for (const id of selectedItemIds) {
      if (applicableItems.some((f) => f.id === id)) {
        formData.append("fee_item_ids", id);
      }
    }

    // Set uniform_items as JSON: [{fee_item_id, quantity}]
    const uniformItems = allUniforms
      .filter((u) => (uniformQty[u.id] ?? 0) > 0)
      .map((u) => ({
        fee_item_id: u.id,
        quantity: uniformQty[u.id],
      }));
    formData.set("uniform_items", JSON.stringify(uniformItems));

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
      if (res.invoiceId) {
        window.open(
          `/app/invoices/${res.invoiceId}`,
          "_blank",
          "noopener,noreferrer",
        );
      }
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
            New Registration
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
                {LEVEL_ORDER.map((level) => {
                  const group = classes.filter((c) => c.level === level);
                  if (group.length === 0) return null;
                  return (
                    <optgroup key={level} label={LEVEL_LABEL[level]}>
                      {group.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                {(() => {
                  const ungrouped = classes.filter((c) => !c.level);
                  if (ungrouped.length === 0) return null;
                  return (
                    <optgroup label="Other">
                      {ungrouped.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })()}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" name="dob" type="date" disabled={pending} />
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
                  {allRegistrationFees.length === 0
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
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-sp-card-alt">
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

          {/* Uniforms section */}
          {allUniforms.length > 0 && (
            <div className="rounded-lg border border-border">
              <div className="flex items-center gap-2 border-b border-border bg-sp-card-alt px-4 py-3">
                <Shirt className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-semibold">Uniforms</p>
                  <p className="text-[11px] text-muted-foreground">
                    Select uniforms this student needs and set the quantity.
                  </p>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto p-2">
                <ul className="divide-y divide-border">
                  {allUniforms.map((u) => {
                    const qty = uniformQty[u.id] ?? 0;
                    const isSelected = qty > 0;
                    return (
                      <li key={u.id}>
                        <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUniform(u.id)}
                            disabled={pending}
                            className="size-4"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatMoney(u.amount_usd)} each
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] text-muted-foreground">
                                Qty:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={qty}
                                onChange={(e) =>
                                  setQty(
                                    u.id,
                                    Math.max(1, parseInt(e.target.value) || 1),
                                  )
                                }
                                disabled={pending}
                                className="h-7 w-14 rounded border border-input bg-card px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                          )}
                          <p className="min-w-[70px] text-right font-semibold tabular-nums">
                            {isSelected
                              ? formatMoney(toNumber(u.amount_usd) * qty)
                              : "—"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

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
                <FileText className="size-4" />
              )}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
