"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, FileText, Loader2, Shirt, UserPlus } from "lucide-react";
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
import { cn } from "@/lib/utils";
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
  /**
   * ISO date of the current term's start. In carry-over mode we default
   * the enrolment date to this so the student's record reflects the
   * term boundary rather than the day they were keyed in.
   */
  termStartDate?: string;
}

/** Quantity state for uniform items: id → quantity (0 = not selected) */
type UniformQtyMap = Record<string, number>;
/** Carry-over paid amounts per fee item id. */
type PaidMap = Record<string, number>;
/** "new" = first-time enrolment; "existing" = student already had history before SchoolPurse. */
type Mode = "new" | "existing";

export function NewChildDialog({
  open,
  onOpenChange,
  classes,
  feeItems,
  termStartDate,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [mode, setMode] = React.useState<Mode>("new");
  const [classId, setClassId] = React.useState<string>("");
  const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [uniformQty, setUniformQty] = React.useState<UniformQtyMap>({});
  const [paidAmounts, setPaidAmounts] = React.useState<PaidMap>({});

  const todayIso = React.useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );
  // In carry-over mode default to term start so reports reflect the term
  // boundary; fall back to today if no current term is configured.
  const enrollmentDefault =
    mode === "existing" && termStartDate ? termStartDate : todayIso;

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

  // Helper: clamp paid_so_far between 0 and the fee's amount so we never
  // show "balance owing" as a negative number even if the bursar typed
  // more than the fee in the "Paid so far" input.
  const paidFor = React.useCallback(
    (id: string, amount: number) =>
      Math.max(0, Math.min(paidAmounts[id] ?? 0, amount)),
    [paidAmounts],
  );

  // Totals
  // chargedTotal = full price of every selected fee (what the school billed)
  // paidTotal    = sum of carry-over paid_so_far across selected fees
  // feeOwed      = chargedTotal - paidTotal (the balance still owing)
  // uniformTotal = qty × price across selected uniforms
  const { chargedTotal, paidTotal } = React.useMemo(() => {
    let charged = 0;
    let paid = 0;
    for (const f of applicableItems) {
      if (!selectedItemIds.has(f.id)) continue;
      const amount = toNumber(f.amount_usd);
      charged += amount;
      if (mode === "existing") paid += paidFor(f.id, amount);
    }
    return { chargedTotal: charged, paidTotal: paid };
  }, [applicableItems, selectedItemIds, mode, paidFor]);

  const uniformTotal = React.useMemo(
    () =>
      allUniforms.reduce((sum, u) => {
        const qty = uniformQty[u.id] ?? 0;
        return sum + toNumber(u.amount_usd) * qty;
      }, 0),
    [allUniforms, uniformQty],
  );

  // Opening-balance figure displayed in the bundle header.
  //   new mode      → full bill (what the parent owes)
  //   existing mode → balance still owing after carry-over payments
  const openingBalance =
    mode === "existing"
      ? Math.max(0, chargedTotal - paidTotal) + uniformTotal
      : chargedTotal + uniformTotal;

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

  function setPaid(id: string, amount: number) {
    setPaidAmounts((prev) => ({ ...prev, [id]: Math.max(0, amount) }));
  }

  function reset() {
    setMode("new");
    setClassId("");
    setSelectedItemIds(new Set());
    setUniformQty({});
    setPaidAmounts({});
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

    // Carry-over fields. Only send paid_amounts in existing-student mode
    // so a stale paid-so-far input can't accidentally affect a fresh
    // enrolment if the bursar toggled modes and back again.
    formData.set("is_carry_over", mode === "existing" ? "true" : "false");
    if (mode === "existing") {
      const paidPayload = applicableItems
        .filter((f) => selectedItemIds.has(f.id))
        .map((f) => ({
          fee_item_id: f.id,
          paid_usd: paidFor(f.id, toNumber(f.amount_usd)),
        }))
        .filter((p) => p.paid_usd > 0);
      formData.set("paid_amounts", JSON.stringify(paidPayload));
    } else {
      formData.set("paid_amounts", "[]");
    }

    startTransition(async () => {
      const res = await enrollChild(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const name = String(formData.get("first_name") ?? "").trim();
      // Carry-over toast reads more accurately as "balance owing" rather than
      // "invoice created" since the parent has already paid part of the fees.
      if (mode === "existing") {
        const owing = Math.max(0, chargedTotal - paidTotal) + uniformTotal;
        toast.success(
          res.invoiceId
            ? `${name} carried over — ${formatMoney(owing)} balance owing`
            : `${name} added (no carry-over invoice — nothing was selected)`,
        );
      } else {
        toast.success(
          res.invoiceId
            ? `${name} enrolled — ${formatMoney(res.total)} invoice created`
            : `${name} enrolled (no fees billed yet)`,
        );
      }
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
          {/* Mode toggle — switches the dialog between a clean-slate enrolment
              and a carry-over enrolment for students who already paid some
              fees + received uniforms before the school started using SchoolPurse. */}
          <div
            role="radiogroup"
            aria-label="Registration mode"
            className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-sp-card-alt p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={mode === "new"}
              onClick={() => setMode("new")}
              disabled={pending}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-semibold transition",
                mode === "new"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <UserPlus className="size-3.5" />
              New student
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "existing"}
              onClick={() => setMode("existing")}
              disabled={pending}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-semibold transition",
                mode === "existing"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowDownToLine className="size-3.5" />
              Existing student (carry-over)
            </button>
          </div>
          {mode === "existing" ? (
            <p className="-mt-2 rounded-md border border-sp-amber/30 bg-sp-amber-soft px-3 py-2 text-[11.5px] leading-relaxed text-sp-amber">
              Carry-over mode: record what this student already paid before
              SchoolPurse. The invoice will show the remaining balance only,
              and the carry-over amount is excluded from income/revenue
              reports so it doesn&apos;t inflate this month&apos;s figures.
            </p>
          ) : null}

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
            <Label htmlFor="enrollment_date">
              Enrollment date
              {mode === "existing" ? (
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                  · defaults to term start
                </span>
              ) : null}
            </Label>
            {/* `key={mode}` forces a remount so the defaultValue switches
                from today → term-start when the bursar toggles the mode. */}
            <Input
              key={`enrollment-${mode}`}
              id="enrollment_date"
              name="enrollment_date"
              type="date"
              required
              defaultValue={enrollmentDefault}
              disabled={pending}
              className="sm:w-1/2"
            />
          </div>

          {/* Parent / guardian — parent_phone is where fee reminders go. */}
          <div className="space-y-3 rounded-lg border border-border bg-sp-card-alt/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sp-text-sub">
              Parent / guardian
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="parent_name">Name</Label>
                <Input id="parent_name" name="parent_name" disabled={pending} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parent_phone">
                  Phone <span className="text-muted-foreground">· reminders</span>
                </Label>
                <Input
                  id="parent_phone"
                  name="parent_phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+263 77 123 4567"
                  disabled={pending}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="parent_email">Email (optional)</Label>
                <Input
                  id="parent_email"
                  name="parent_email"
                  type="email"
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="home_address">Home address</Label>
                <Input
                  id="home_address"
                  name="home_address"
                  disabled={pending}
                />
              </div>
            </div>
          </div>

          {/* Registration bundle */}
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-sp-card-alt px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold">
                  {mode === "existing" ? "Carry-over fees" : "Registration bundle"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {mode === "existing"
                    ? "Pick each fee that's been billed to this student previously, then enter how much they've already paid against it."
                    : "Fees marked \"include on registration\" in Settings. Pick a class to see class-specific items."}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                  {mode === "existing" ? "Balance owing" : "Opening balance"}
                </p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {formatMoney(openingBalance)}
                </p>
                {mode === "existing" && paidTotal > 0 ? (
                  <p className="text-[10.5px] text-muted-foreground">
                    {formatMoney(paidTotal)} already paid
                  </p>
                ) : null}
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
                    const amount = toNumber(f.amount_usd);
                    const paid = paidFor(f.id, amount);
                    const fullyPaid = mode === "existing" && paid >= amount;
                    return (
                      <li key={f.id}>
                        <div className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-sp-card-alt">
                          {/* The checkbox + label still own the click, but
                              we render the "Paid so far" input as a sibling
                              so its clicks don't toggle the checkbox. */}
                          <label className="flex flex-1 cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleItem(f.id)}
                              disabled={pending}
                              className="size-4 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{f.name}</p>
                              <p className="text-[11px] capitalize text-muted-foreground">
                                {f.type}
                              </p>
                            </div>
                            <p className="font-semibold tabular-nums">
                              {formatMoney(amount)}
                            </p>
                          </label>
                          {mode === "existing" && checked ? (
                            <div className="flex shrink-0 items-center gap-1.5">
                              <label
                                htmlFor={`paid-${f.id}`}
                                className="text-[11px] text-muted-foreground"
                              >
                                Paid:
                              </label>
                              <span className="text-[11px] text-muted-foreground">
                                $
                              </span>
                              <input
                                id={`paid-${f.id}`}
                                type="number"
                                min={0}
                                max={amount}
                                step={0.01}
                                value={paidAmounts[f.id] ?? 0}
                                onChange={(e) =>
                                  setPaid(
                                    f.id,
                                    Number.parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={pending}
                                className="h-7 w-20 rounded border border-input bg-card px-2 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              {fullyPaid ? (
                                <span className="text-[10.5px] font-semibold text-sp-green">
                                  Paid ✓
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
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
              ) : mode === "existing" ? (
                <ArrowDownToLine className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
              {mode === "existing" ? "Carry over student" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
