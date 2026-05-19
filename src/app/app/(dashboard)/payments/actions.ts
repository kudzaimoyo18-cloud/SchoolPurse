"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type RecordPaymentResult =
  | { ok: true; paymentId: string; receiptNumber: string }
  | { ok: false; error: string };

// Each allocation tells the server "put $X of this payment against this
// invoice_line". Multiple allocations let the bursar split one payment
// across several fees (school fees + registration + extras, etc).
const AllocationSchema = z.object({
  invoice_line_id: z.string().uuid(),
  amount_usd: z.coerce.number().positive(),
});

const PaymentSchema = z.object({
  student_id: z.string().uuid("Pick a student"),
  amount_usd: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["cash", "bank_transfer", "mobile_money"]),
  paid_at: z.string().min(1, "Date is required"),
  payer_name: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  // Multi-line allocations. Empty array = credit payment (no line allocation).
  // Sum of allocations must equal amount_usd (validated below).
  allocations: z.array(AllocationSchema).default([]),
});

async function getContext() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("id, name, school_id")
    .eq("id", user.user.id)
    .maybeSingle();
  if (!profile?.school_id) return null;
  return {
    supabase,
    userId: profile.id as string,
    userName: profile.name as string,
    schoolId: profile.school_id as string,
  };
}

export async function recordPayment(
  formData: FormData,
): Promise<RecordPaymentResult> {
  // Parse allocations JSON sent from the form. Malformed JSON used to fall
  // back to [] which silently turned the payment into an unallocated credit;
  // we now fail fast so the bursar can retry.
  let parsedAllocations: unknown = [];
  const rawAllocations = formData.get("allocations");
  if (typeof rawAllocations === "string" && rawAllocations.trim()) {
    try {
      parsedAllocations = JSON.parse(rawAllocations);
    } catch {
      return {
        ok: false,
        error: "Malformed allocations payload. Refresh the page and try again.",
      };
    }
  }

  const parsed = PaymentSchema.safeParse({
    student_id: formData.get("student_id"),
    amount_usd: formData.get("amount_usd"),
    method: formData.get("method"),
    paid_at: formData.get("paid_at"),
    payer_name: formData.get("payer_name") || "",
    notes: formData.get("notes") || "",
    allocations: parsedAllocations,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ctx = await getContext();
  if (!ctx) return { ok: false, error: "Not authenticated" };
  const { supabase, schoolId, userId, userName } = ctx;

  const { allocations } = parsed.data;
  const paymentAmount = parsed.data.amount_usd;

  // Sanity check: if allocations were provided, their sum must match the
  // recorded payment amount (within a cent). Otherwise the receipt total
  // and the line breakdown would disagree.
  if (allocations.length > 0) {
    const allocSum = allocations.reduce((s, a) => s + a.amount_usd, 0);
    if (Math.abs(allocSum - paymentAmount) > 0.01) {
      return {
        ok: false,
        error: `Allocation total ($${allocSum.toFixed(2)}) doesn't match payment amount ($${paymentAmount.toFixed(2)}).`,
      };
    }
    // No duplicate lines — would create two allocation rows against the same
    // line which the trigger would mis-attribute.
    const seen = new Set<string>();
    for (const a of allocations) {
      if (seen.has(a.invoice_line_id)) {
        return { ok: false, error: "Duplicate fee item in allocations." };
      }
      seen.add(a.invoice_line_id);
    }
  }

  // 0. Defense in depth: verify the student belongs to this school before
  //    inserting. RLS would already block cross-school inserts via the
  //    payments.school_id check, but this gives a friendlier error and
  //    prevents inserting a payment pointing at an unrelated student.
  const { data: studentRow } = await supabase
    .from("students")
    .select("id, school_id")
    .eq("id", parsed.data.student_id)
    .maybeSingle();
  if (
    !studentRow ||
    (studentRow as { school_id: string }).school_id !== schoolId
  ) {
    return { ok: false, error: "Student not found in this school." };
  }

  // 0b. If allocations were provided, fetch all referenced lines in one query
  //     and verify they all belong to this student in this school, with
  //     sufficient remaining balance. We do this BEFORE inserting the payment
  //     so we never half-commit.
  type LineRow = {
    id: string;
    amount_usd: number | string;
    paid_usd: number | string;
    invoices:
      | { id: string; school_id: string; student_id: string; status: string }
      | Array<{
          id: string;
          school_id: string;
          student_id: string;
          status: string;
        }>;
  };
  let validatedLines: Map<string, { id: string; balance: number }> = new Map();
  if (allocations.length > 0) {
    const lineIds = allocations.map((a) => a.invoice_line_id);
    const { data: lineRows, error: linesErr } = await supabase
      .from("invoice_lines")
      .select(
        "id, amount_usd, paid_usd, invoices!inner(id, school_id, student_id, status)",
      )
      .in("id", lineIds);

    if (linesErr) {
      return {
        ok: false,
        error: "Could not load fee items: " + linesErr.message,
      };
    }
    const rows = (lineRows ?? []) as LineRow[];
    if (rows.length !== lineIds.length) {
      return { ok: false, error: "Some fee items couldn't be found." };
    }
    for (const ln of rows) {
      const inv = Array.isArray(ln.invoices) ? ln.invoices[0] : ln.invoices;
      if (
        !inv ||
        inv.school_id !== schoolId ||
        inv.student_id !== parsed.data.student_id
      ) {
        return {
          ok: false,
          error: "One of the fee items isn't on this student's invoice.",
        };
      }
      const balance = Math.max(
        Number(ln.amount_usd) - Number(ln.paid_usd),
        0,
      );
      validatedLines.set(ln.id, { id: ln.id, balance });
    }
    // Per-allocation overpay check.
    for (const a of allocations) {
      const ln = validatedLines.get(a.invoice_line_id);
      if (!ln) continue;
      if (a.amount_usd > ln.balance + 0.01) {
        return {
          ok: false,
          error: `One allocation ($${a.amount_usd.toFixed(2)}) exceeds the line balance ($${ln.balance.toFixed(2)}).`,
        };
      }
    }
  }

  // 1. Issue a receipt number via the RPC
  const { data: receipt, error: rcptErr } = await supabase.rpc(
    "next_receipt_number",
    { p_school_id: schoolId },
  );
  if (rcptErr || !receipt) {
    return {
      ok: false,
      error: rcptErr?.message ?? "Could not generate receipt number",
    };
  }
  const receiptNumber = String(receipt);

  // 2. Insert payment
  const paidAtIso = new Date(parsed.data.paid_at + "T12:00:00Z").toISOString();
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      school_id: schoolId,
      student_id: parsed.data.student_id,
      payer_name_snapshot: parsed.data.payer_name || null,
      amount_usd: paymentAmount,
      method: parsed.data.method,
      paid_at: paidAtIso,
      receipt_number: receiptNumber,
      recorded_by: userId,
      recorded_by_name_snapshot: userName,
      notes: parsed.data.notes || null,
      status: "completed",
    })
    .select("id")
    .single();

  if (payErr || !payment) {
    return { ok: false, error: payErr?.message ?? "Failed to record payment" };
  }
  const pay = payment as { id: string };

  // 3. Allocate. Two paths:
  //    (a) Bursar provided allocations → bulk-insert one payment_allocations
  //        row per line. The sync_invoice_line_paid trigger updates each
  //        invoice_line.paid_usd, which in turn promotes invoice.status.
  //    (b) No allocations (credit payment) → leave the payment unallocated.
  //        The student's lifetime-paid still goes up but no specific line is
  //        credited; the bursar can apply the credit later.
  if (allocations.length > 0) {
    const rows = allocations.map((a) => ({
      payment_id: pay.id,
      invoice_line_id: a.invoice_line_id,
      amount_usd: a.amount_usd,
    }));
    const { error: allocErr } = await supabase
      .from("payment_allocations")
      .insert(rows);
    if (allocErr) {
      // Don't unwind the payment insert — surface as a clear error so the
      // bursar can void+retry. RLS would have already blocked cross-school.
      return {
        ok: false,
        error: "Payment saved but allocation failed: " + allocErr.message,
      };
    }
  }

  revalidatePath("/app/payments");
  revalidatePath("/app/arrears");
  revalidatePath("/app/overview");
  return { ok: true, paymentId: pay.id, receiptNumber };
}

export async function voidPayment(
  id: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getContext();
  if (!ctx) return { ok: false, error: "Not authenticated" };
  const { supabase, schoolId, userId } = ctx;

  // Defense in depth: confirm the payment is on this school before mutating.
  // RLS UPDATE policy on payments already enforces school_id = auth_school_id()
  // AND is_finance_user(), but a cleaner error here helps debugging.
  const { data: existing } = await supabase
    .from("payments")
    .select("id, school_id")
    .eq("id", id)
    .maybeSingle();
  if (
    !existing ||
    (existing as { school_id: string }).school_id !== schoolId
  ) {
    return { ok: false, error: "Payment not found in this school." };
  }

  const { error } = await supabase
    .from("payments")
    .update({
      status: "void",
      void_reason: reason || null,
      voided_at: new Date().toISOString(),
      voided_by: userId,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/payments");
  revalidatePath("/app/arrears");
  revalidatePath("/app/overview");
  return { ok: true };
}
