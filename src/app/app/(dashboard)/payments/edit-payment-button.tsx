"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
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
import { editPayment } from "./actions";

interface Props {
  paymentId: string;
  receiptNumber: string;
  studentName: string;
  amountLabel: string;
  initial: {
    method: string;
    paid_at: string; // yyyy-mm-dd
    payer_name: string;
    notes: string;
  };
}

/**
 * Head/admin-only correction dialog for a receipt's date, method, payer and
 * notes. Amount isn't editable here — that goes through void + re-record so the
 * audit trail stays intact (see editPayment in actions.ts). Rendered only for
 * school_admin / platform_admin by payments/page.tsx.
 */
export function EditPaymentButton({
  paymentId,
  receiptNumber,
  studentName,
  amountLabel,
  initial,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState(initial.method);
  const [paidAt, setPaidAt] = React.useState(initial.paid_at);
  const [payerName, setPayerName] = React.useState(initial.payer_name);
  const [notes, setNotes] = React.useState(initial.notes);
  const [pending, startTransition] = React.useTransition();

  // Reset fields to the latest values whenever the dialog (re)opens.
  React.useEffect(() => {
    if (open) {
      setMethod(initial.method);
      setPaidAt(initial.paid_at);
      setPayerName(initial.payer_name);
      setNotes(initial.notes);
    }
  }, [open, initial]);

  function handleSave() {
    if (!paidAt) {
      toast.error("Date is required.");
      return;
    }
    startTransition(async () => {
      const res = await editPayment(paymentId, {
        method,
        paid_at: paidAt,
        payer_name: payerName,
        notes,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Receipt ${receiptNumber} updated`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit receipt ${receiptNumber}`}
        title="Edit this receipt"
        className="inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground transition hover:text-foreground hover:underline"
      >
        <Pencil className="size-3.5" />
        Edit
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit receipt {receiptNumber}</DialogTitle>
            <DialogDescription>
              {amountLabel} from {studentName}. You can fix the date, method,
              payer or notes. To change the <strong>amount</strong>, void this
              receipt and record a new one so the audit trail stays intact.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-paid-at">Date</Label>
              <Input
                id="edit-paid-at"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-method">Method</Label>
              <select
                id="edit-method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={pending}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="mobile_money">Mobile money</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-payer">Payer name</Label>
              <Input
                id="edit-payer"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Who paid (optional)"
                maxLength={200}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note for the audit trail"
                rows={2}
                maxLength={2000}
                disabled={pending}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
