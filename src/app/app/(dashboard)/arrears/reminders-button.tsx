"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { sendArrearsReminders } from "./actions";

// AI-plan button: queue WhatsApp fee reminders to every family in arrears.
export function RemindersButton() {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const r = await sendArrearsReminders();
      if (!r.ok) {
        toast.error(r.error ?? "Couldn't send reminders.");
        return;
      }
      const sent = r.sent ?? 0;
      const skipped = r.skipped ?? 0;
      const noPhone = r.noPhone ?? 0;
      const failed = r.failed ?? 0;

      if (sent === 0 && skipped === 0 && failed === 0) {
        toast.info(
          noPhone > 0
            ? `No reminders sent — ${noPhone} ${plural(noPhone, "family has", "families have")} no phone on file.`
            : "No families in arrears to remind.",
        );
        return;
      }

      // No provider connected yet → messages are stored ("skipped"), not delivered.
      if (sent === 0 && skipped > 0) {
        toast.success(
          `Saved ${skipped} ${plural(skipped, "reminder", "reminders")}. Connect a WhatsApp provider to deliver them.`,
        );
        return;
      }

      const parts: string[] = [];
      if (sent) parts.push(`${sent} sent`);
      if (failed) parts.push(`${failed} failed`);
      if (noPhone) parts.push(`${noPhone} no phone`);
      toast.success(`Reminders: ${parts.join(", ")}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      <Send className="size-3.5" strokeWidth={2.2} />
      {busy ? "Sending…" : "Send reminders"}
    </button>
  );
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
