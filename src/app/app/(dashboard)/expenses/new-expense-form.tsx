"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createExpense, createCategory } from "./actions";

interface Category {
  id: string;
  name: string;
}

export function NewExpenseForm({
  categories,
  isTransport = false,
}: {
  categories: Category[];
  isTransport?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [showNewCategory, setShowNewCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await createExpense(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isTransport ? "Bus expense logged" : "Expense logged");
      formRef.current?.reset();
      router.refresh();
    });
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      const res = await createCategory(newCategoryName);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Category added");
      setNewCategoryName("");
      setShowNewCategory(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant={isTransport ? "outline" : "default"}
      >
        <Plus className="size-4" />
        {isTransport ? "Add school bus expense" : "Add expense"}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14.5px] font-semibold">
          {isTransport ? "New school bus expense" : "New expense"}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground transition hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <input
          type="hidden"
          name="is_transport"
          value={isTransport ? "true" : "false"}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="expense_date">Date</Label>
            <Input
              id="expense_date"
              name="expense_date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              required
              placeholder={
                isTransport
                  ? "e.g. Diesel for bus, Driver wages, Tyre repair"
                  : "e.g. Electricity bill — April"
              }
              disabled={pending}
            />
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
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Category</Label>
            <div className="flex items-center gap-2">
              <select
                id="category_id"
                name="category_id"
                disabled={pending}
                className="flex h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Uncategorised —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {!showNewCategory ? (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                  New
                </button>
              ) : null}
            </div>
            {showNewCategory ? (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addCategory}
                  disabled={pending || !newCategoryName.trim()}
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName("");
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payee">Payee (optional)</Label>
            <Input
              id="payee"
              name="payee"
              placeholder="Vendor or contractor"
              disabled={pending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
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
            Save expense
          </Button>
        </div>
      </form>
    </div>
  );
}
