"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Plus, Search, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { recordPayment } from "./actions";
import { quickAddStudent } from "@/app/app/(dashboard)/students/quick-add-action";

export interface OutstandingLine {
  id: string;
  description: string;
  balance: number;
  invoice_period: string | null;
  due_date: string | null;
}

interface StudentOption {
  id: string;
  name: string;
  class_name: string | null;
  outstanding_lines: OutstandingLine[];
}

interface ClassOption {
  id: string;
  name: string;
  level: "ecd" | "primary" | "secondary" | "college" | null;
}

const LEVEL_LABEL: Record<
  NonNullable<ClassOption["level"]>,
  string
> = {
  ecd: "ECD",
  primary: "Primary",
  secondary: "Secondary",
  college: "College",
};

const LEVEL_ORDER: Array<NonNullable<ClassOption["level"]>> = [
  "ecd",
  "primary",
  "secondary",
  "college",
];

export function NewPaymentForm({
  students: initialStudents,
  classes = [],
  defaultOpen = false,
}: {
  students: StudentOption[];
  classes?: ClassOption[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(defaultOpen);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [studentId, setStudentId] = React.useState("");
  const [studentLabel, setStudentLabel] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);
  // Local students list — seeded from props but extended in-place when the
  // bursar adds a student via the quick-add mini-form. Avoids a full
  // router.refresh() round-trip on every add.
  const [students, setStudents] = React.useState<StudentOption[]>(
    () => initialStudents,
  );
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);
  // Quick-add mini-form state. Opened from the search dropdown when there
  // are no matches; lets the bursar create a minimal student record and
  // continue with the payment in the same flow.
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [quickAddPending, startQuickAdd] = React.useTransition();
  const [quickAddFirst, setQuickAddFirst] = React.useState("");
  const [quickAddLast, setQuickAddLast] = React.useState("");
  const [quickAddClass, setQuickAddClass] = React.useState("");
  // Per-line allocation amounts as strings (input.value is always string).
  // Empty string = "not entered yet" = $0. We parse to numeric at submit.
  const [allocations, setAllocations] = React.useState<Record<string, string>>(
    {},
  );
  // Credit-payment amount: used only when the student has NO outstanding
  // lines — the bursar can still record an advance/credit payment.
  const [creditAmount, setCreditAmount] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);

  const selectedStudent = React.useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );
  const outstandingLines = selectedStudent?.outstanding_lines ?? [];
  const hasOutstanding = outstandingLines.length > 0;
  const totalOutstanding = React.useMemo(
    () => outstandingLines.reduce((sum, ln) => sum + Math.max(ln.balance, 0), 0),
    [outstandingLines],
  );

  // Reset allocations whenever the picked student changes. We don't pre-fill
  // amounts — the bursar always types what the parent actually paid per line.
  React.useEffect(() => {
    setAllocations({});
    setCreditAmount("");
  }, [studentId]);

  // Live total = sum of per-line allocations. This is what gets stored as the
  // payment.amount_usd (so the receipt total always matches the breakdown).
  const allocationsTotal = React.useMemo(() => {
    return outstandingLines.reduce((sum, ln) => {
      const v = parseFloat(allocations[ln.id] ?? "");
      return sum + (Number.isFinite(v) && v > 0 ? v : 0);
    }, 0);
  }, [allocations, outstandingLines]);

  const totalForSubmit = hasOutstanding
    ? allocationsTotal
    : parseFloat(creditAmount) || 0;

  // Filter the student dropdown by typed search term.
  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students.slice(0, 8);
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.class_name ?? "").toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [search, students]);

  function pickStudent(s: StudentOption) {
    setStudentId(s.id);
    setStudentLabel(`${s.name}${s.class_name ? ` · ${s.class_name}` : ""}`);
    setSearch(`${s.name}${s.class_name ? ` · ${s.class_name}` : ""}`);
    setShowResults(false);
  }

  function clearStudent() {
    setStudentId("");
    setStudentLabel("");
    setSearch("");
    setAllocations({});
    setCreditAmount("");
  }

  // Open the inline mini-form pre-populated with whatever the bursar has
  // typed in the search box. We split on the first space so a quick "Tendai
  // Moyo" turns into First=Tendai, Last=Moyo.
  function openQuickAdd() {
    const parts = search.trim().split(/\s+/);
    setQuickAddFirst(parts[0] ?? "");
    setQuickAddLast(parts.slice(1).join(" "));
    setQuickAddClass("");
    setQuickAddOpen(true);
    setShowResults(false);
  }

  function cancelQuickAdd() {
    setQuickAddOpen(false);
    setQuickAddFirst("");
    setQuickAddLast("");
    setQuickAddClass("");
  }

  function submitQuickAdd() {
    if (!quickAddFirst.trim() || !quickAddLast.trim()) {
      toast.error("Both first and last name are required");
      return;
    }
    startQuickAdd(async () => {
      const fd = new FormData();
      fd.set("first_name", quickAddFirst.trim());
      fd.set("last_name", quickAddLast.trim());
      if (quickAddClass) fd.set("class_id", quickAddClass);
      const res = await quickAddStudent(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const newStudent: StudentOption = {
        id: res.student.id,
        name: res.student.name,
        class_name: res.student.class_name,
        // Fresh student → no outstanding lines → payment becomes a
        // credit on account (the existing recordPayment path handles this).
        outstanding_lines: [],
      };
      setStudents((prev) => [newStudent, ...prev]);
      pickStudent(newStudent);
      cancelQuickAdd();
      toast.success(
        `${res.student.name} added — record their payment now. The amount will become a credit on their account until you invoice their fees.`,
      );
    });
  }

  function updateAllocation(lineId: string, value: string) {
    setAllocations((prev) => {
      const next = { ...prev };
      if (!value || value === "0") {
        delete next[lineId];
      } else {
        next[lineId] = value;
      }
      return next;
    });
  }

  // Convenience: clicking "Pay full balance" on a row fills that row with the
  // exact outstanding balance so the bursar doesn't have to retype it.
  function fillFullBalance(line: OutstandingLine) {
    updateAllocation(line.id, line.balance.toFixed(2));
  }

  // The common case: the parent clears everything. One tap fills every row to
  // its full balance so the bursar doesn't enter each line by hand.
  function payAllInFull() {
    const next: Record<string, string> = {};
    for (const ln of outstandingLines) {
      if (ln.balance > 0) next[ln.id] = ln.balance.toFixed(2);
    }
    setAllocations(next);
  }

  function clearAllocations() {
    setAllocations({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentId) {
      toast.error("Pick a student first");
      return;
    }
    if (totalForSubmit <= 0) {
      toast.error("Enter at least one payment amount");
      return;
    }
    // Build the allocations payload from per-line entries.
    const allocationsPayload = outstandingLines
      .map((ln) => {
        const amount = parseFloat(allocations[ln.id] ?? "");
        return Number.isFinite(amount) && amount > 0
          ? { invoice_line_id: ln.id, amount_usd: amount }
          : null;
      })
      .filter((a): a is { invoice_line_id: string; amount_usd: number } => !!a);

    const formData = new FormData(event.currentTarget);
    formData.set("student_id", studentId);
    formData.set("amount_usd", String(totalForSubmit));
    formData.set("allocations", JSON.stringify(allocationsPayload));

    startTransition(async () => {
      const res = await recordPayment(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSuccess(res.receiptNumber);
      toast.success(`Receipt ${res.receiptNumber} issued`);
      formRef.current?.reset();
      clearStudent();
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Record payment
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14.5px] font-semibold">New payment</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground transition hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {success ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          <Check className="size-4" />
          <span className="font-semibold">Saved!</span> Receipt {success} issued.
        </div>
      ) : null}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Top row: student autocomplete + payment date (the amount field
            now lives inside the per-line allocation table below). */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Student autocomplete */}
          <div className="relative space-y-1.5">
            <Label htmlFor="student_search">Student</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="student_search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowResults(true);
                  if (e.target.value !== studentLabel) setStudentId("");
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="Type a name…"
                autoComplete="off"
                className="pl-9"
                disabled={pending}
              />
            </div>
            {showResults && !quickAddOpen ? (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickStudent(s)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-sp-card-alt",
                        studentId === s.id && "bg-sp-card-alt",
                      )}
                    >
                      <span>{s.name}</span>
                      {s.class_name ? (
                        <span className="text-xs text-muted-foreground">
                          {s.class_name}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    No matches.
                  </li>
                ) : null}
                {/* Quick-add affordance: lets the bursar create a new student
                    inline without leaving the payment form. */}
                <li className="border-t border-border bg-sp-card-alt">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={openQuickAdd}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-primary transition hover:bg-card"
                  >
                    <UserPlus className="size-3.5" />
                    Add new student
                    {search.trim() ? (
                      <span className="text-muted-foreground">
                        : &ldquo;{search.trim()}&rdquo;
                      </span>
                    ) : null}
                  </button>
                </li>
              </ul>
            ) : null}

            {/* Inline mini-form. Shown when "Add new student" is clicked,
                replaces the search dropdown until the bursar saves or cancels. */}
            {quickAddOpen ? (
              <div className="absolute z-20 mt-1 w-full space-y-3 rounded-md border border-primary/30 bg-card p-3 shadow-lg ring-1 ring-primary/10">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-semibold text-foreground">
                    <UserPlus className="mr-1.5 inline size-3.5 text-primary" />
                    Add new student
                  </p>
                  <button
                    type="button"
                    onClick={cancelQuickAdd}
                    className="text-muted-foreground transition hover:text-foreground"
                    aria-label="Cancel"
                    disabled={quickAddPending}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="First name"
                    value={quickAddFirst}
                    onChange={(e) => setQuickAddFirst(e.target.value)}
                    disabled={quickAddPending}
                    autoFocus
                  />
                  <Input
                    placeholder="Last name"
                    value={quickAddLast}
                    onChange={(e) => setQuickAddLast(e.target.value)}
                    disabled={quickAddPending}
                  />
                </div>
                <select
                  value={quickAddClass}
                  onChange={(e) => setQuickAddClass(e.target.value)}
                  disabled={quickAddPending}
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— No class (set later) —</option>
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
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelQuickAdd}
                    disabled={quickAddPending}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={submitQuickAdd}
                    disabled={quickAddPending}
                    size="sm"
                  >
                    {quickAddPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="size-3.5" />
                    )}
                    Add &amp; select
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paid_at">Date</Label>
            <Input
              id="paid_at"
              name="paid_at"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              disabled={pending}
            />
          </div>
        </div>

        {/* Per-line allocation table. The bursar enters how much of the
            payment goes against each outstanding fee item. Total at the
            bottom is the receipt amount. */}
        {studentId ? (
          hasOutstanding ? (
            <div className="rounded-lg border border-border">
              <div className="border-b border-border bg-sp-card-alt px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold">Paying for</p>
                    <p className="text-[11px] text-muted-foreground">
                      Total outstanding{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatMoney(totalOutstanding)}
                      </span>
                      . Pay it all in one tap, or enter amounts per item.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
                      Receipt total
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        allocationsTotal > 0
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatMoney(allocationsTotal)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={payAllInFull}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                  >
                    <Check className="size-3" strokeWidth={2.5} />
                    Pay all in full
                  </button>
                  {allocationsTotal > 0 ? (
                    <button
                      type="button"
                      onClick={clearAllocations}
                      disabled={pending}
                      className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
              <ul className="divide-y divide-border">
                {outstandingLines.map((ln) => {
                  const value = allocations[ln.id] ?? "";
                  const numeric = parseFloat(value);
                  const overpay =
                    Number.isFinite(numeric) && numeric > ln.balance;
                  return (
                    <li
                      key={ln.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {ln.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>
                            Balance{" "}
                            <span className="tabular-nums">
                              {formatMoney(ln.balance)}
                            </span>
                          </span>
                          {ln.invoice_period ? (
                            <>
                              <span className="text-border">·</span>
                              <span className="truncate">
                                {ln.invoice_period}
                              </span>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => fillFullBalance(ln)}
                            disabled={pending}
                            className="ml-auto text-primary transition hover:underline disabled:opacity-40"
                          >
                            Pay full
                          </button>
                        </div>
                      </div>
                      <div className="w-32">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={value}
                            onChange={(e) =>
                              updateAllocation(ln.id, e.target.value)
                            }
                            disabled={pending}
                            className={cn(
                              "h-9 pl-6 text-right tabular-nums",
                              overpay && "border-sp-red focus:ring-sp-red",
                            )}
                            aria-label={`Amount paid for ${ln.description}`}
                          />
                        </div>
                        {overpay ? (
                          <p className="mt-1 text-right text-[10px] text-sp-red">
                            Exceeds balance
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="credit_amount">Credit amount (USD)</Label>
              <Input
                id="credit_amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                disabled={pending}
                required
              />
              <p className="text-xs text-muted-foreground">
                No outstanding fees on file — this will be recorded as a credit
                payment with no line allocation.
              </p>
            </div>
          )
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="method">Method</Label>
            <select
              id="method"
              name="method"
              defaultValue="cash"
              disabled={pending}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile_money">Mobile money</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payer_name">Payer name (optional)</Label>
            <Input
              id="payer_name"
              name="payer_name"
              placeholder="e.g. parent/guardian name"
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="optional"
              disabled={pending}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pending || !studentId || totalForSubmit <= 0}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Record {formatMoney(totalForSubmit)} &amp; issue receipt
          </Button>
        </div>
      </form>
    </div>
  );
}
