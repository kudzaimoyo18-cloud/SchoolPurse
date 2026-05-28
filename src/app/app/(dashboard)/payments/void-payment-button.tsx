"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { voidPayment } from "./actions";

interface Props {
  paymentId: string;
  receiptNumber: string;
  amountLabel: string;
  studentName: string;
}

/**
 * Action-column button that voids a payment after asking the school admin
 * for a short reason. Voiding (not hard-deleting) preserves the receipt
 * number gap-free, keeps the audit trail, and lets the existing
 * payment-allocation trigger un-apply the cash from invoice lines.
 *
 * Rendered conditionally by payments/page.tsx — only school_admin and
 * platform_admin see the button (RLS would block bursars anyway, but we
 * hide the affordance for clarity).
 */
export function VoidPaymentButton({
  paymentId,
  receiptNumber,
  amountLabel,
  studentName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function handleVoid() {
    if (reason.trim().length < 3) {
      toast.error("Please enter a reason (at least 3 characters).");
      return;
    }
    startTransition(async () => {
      const res = await voidPayment(paymentId, reason.trim());
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Receipt ${receiptNumber} voided`);
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Void receipt ${receiptNumber}`}
        title="Void this receipt"
        className="inline-flex items-center gap-1 rounded text-xs font-medium text-sp-red transition hover:underline"
      >
        <Trash2 className="size-3.5" />
        Void
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sp-red">
              <TriangleAlert className="size-4" />
              Void this receipt?
            </DialogTitle>
            <DialogDescription>
              This will mark <strong>{receiptNumber}</strong> (
              {amountLabel} from {studentName}) as void. The cash will be
              un-allocated from the invoice lines it was paying for, and the
              receipt will be excluded from totals. The receipt number stays
              issued so the audit trail has no gap.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="void-reason">Reason for voiding</Label>
            <textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='e.g. "Recorded wrong amount", "Parent paid twice", "Wrong student"'
              rows={3}
              maxLength={500}
              disabled={pending}
              required
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="text-[11px] text-muted-foreground">
              Stored on the payment record for audit. Minimum 3 characters.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Keep receipt
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleVoid}
              disabled={pending || reason.trim().length < 3}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Void receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
