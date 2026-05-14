"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { recordPayment } from "./actions";

interface StudentOption {
  id: string;
  name: string;
  class_name: string | null;
}

export function NewPaymentForm({
  students,
  defaultOpen = false,
}: {
  students: StudentOption[];
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
  const formRef = React.useRef<HTMLFormElement>(null);

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
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentId) {
      toast.error("Pick a student first");
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set("student_id", studentId);
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
      // Auto-hide success after a moment
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Student autocomplete */}
          <div className="relative space-y-1.5 md:col-span-1">
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
            {showResults && filtered.length > 0 ? (
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
              </ul>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount_usd">Amount (USD)</Label>
            <Input
              id="amount_usd"
              name="amount_usd"
              type="number"
              step="0.01"
              min="0.01"
              required
              disabled={pending}
            />
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
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Record &amp; issue receipt
          </Button>
        </div>
      </form>
    </div>
  );
}
