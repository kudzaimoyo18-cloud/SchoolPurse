"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type RecordPaymentResult =
  | { ok: true; paymentId: string; receiptNumber: string }
  | { ok: false; error: string };

const PaymentSchema = z.object({
  student_id: z.string().uuid("Pick a student"),
  amount_usd: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["cash", "bank_transfer", "mobile_money"]),
  paid_at: z.string().min(1, "Date is required"),
  payer_name: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  // Optional: when the bursar picks "Paying for", we allocate this payment
  // directly to that invoice_line rather than falling back to oldest-first.
  invoice_line_id: z
    .string()
    .uuid()
    .nullish()
    .or(z.literal("")),
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
  const parsed = PaymentSchema.safeParse({
    student_id: formData.get("student_id"),
    amount_usd: formData.get("amount_usd"),
    method: formData.get("method"),
    paid_at: formData.get("paid_at"),
    payer_name: formData.get("payer_name") || "",
    notes: formData.get("notes") || "",
    invoice_line_id: formData.get("invoice_line_id") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ctx = await getContext();
  if (!ctx) return { ok: false, error: "Not authenticated" };
  const { supabase, schoolId, userId, userName } = ctx;

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
      amount_usd: parsed.data.amount_usd,
      method: parsed.data.method,
      paid_at: paidAtIso,
      receipt_number: receiptNumber,
      recorded_by: userId,
      recorded_by_name_snapshot: userName,
      status: "completed",
    })
    .select("id")
    .single();

  if (payErr || !payment) {
    return { ok: false, error: payErr?.message ?? "Failed to record payment" };
  }
  const pay = payment as { id: string };

  // 3. Allocate the payment. Two paths:
  //    (a) Bursar picked a specific invoice_line ("Paying for") → insert one
  //        payment_allocations row against that line. Any leftover (overpayment
  //        beyond the line's balance) falls back to oldest-first on remaining
  //        open invoices for the student.
  //    (b) No line picked (rare — student has no outstanding fees) → fall
  //        back to the existing oldest-first allocation against the oldest
  //        open/partial invoice.
  const paymentAmount = parsed.data.amount_usd;
  const chosenLineId = parsed.data.invoice_line_id || null;

  if (chosenLineId) {
    // Validate the chosen line: must belong to this school, this student,
    // and have a positive remaining balance. We pull the parent invoice via
    // an inner-join so school/student scoping is enforced server-side.
    const { data: lineRow, error: lineErr } = await supabase
      .from("invoice_lines")
      .select(
        "id, amount_usd, paid_usd, invoices!inner(id, school_id, student_id, status)",
      )
      .eq("id", chosenLineId)
      .maybeSingle();

    type LineShape = {
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
    const line = lineRow as LineShape | null;
    const inv = line
      ? Array.isArray(line.invoices)
        ? line.invoices[0]
        : line.invoices
      : null;

    if (
      lineErr ||
      !line ||
      !inv ||
      inv.school_id !== schoolId ||
      inv.student_id !== parsed.data.student_id
    ) {
      // Soft-fail: the payment is recorded, just unallocated.
      console.error(
        "Invoice line check failed:",
        lineErr?.message ?? "line not in this school/student",
      );
    } else {
      const lineBalance = Math.max(
        Number(line.amount_usd) - Number(line.paid_usd),
        0,
      );
      const toAllocate = Math.min(paymentAmount, lineBalance);

      if (toAllocate > 0) {
        const { error: allocErr } = await supabase
          .from("payment_allocations")
          .insert({
            payment_id: pay.id,
            invoice_line_id: line.id,
            amount_usd: toAllocate,
          });
        if (allocErr) {
          console.error(
            "payment_allocations insert failed:",
            allocErr.message,
          );
        }
      }

      // Overpayment leftover → drop it onto the next oldest open/partial
      // invoice via the existing RPC so it doesn't sit unallocated.
      const leftover = paymentAmount - toAllocate;
      if (leftover > 0.0001) {
        const { data: nextInv } = await supabase
          .from("invoices")
          .select("id, status, due_date, created_at")
          .eq("student_id", parsed.data.student_id)
          .in("status", ["open", "partial"])
          .neq("id", inv.id)
          .order("due_date", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (nextInv) {
          const next = nextInv as { id: string };
          const { error: allocErr2 } = await supabase.rpc(
            "allocate_payment_to_invoice",
            { p_payment_id: pay.id, p_invoice_id: next.id },
          );
          if (allocErr2) {
            console.error(
              "leftover allocate_payment_to_invoice failed:",
              allocErr2.message,
            );
          }
        }
      }
    }
  } else {
    // Fallback: oldest-first allocation against the oldest open invoice.
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status, due_date, created_at")
      .eq("student_id", parsed.data.student_id)
      .in("status", ["open", "partial"])
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (invoice) {
      const inv = invoice as { id: string };
      const { error: allocErr } = await supabase.rpc(
        "allocate_payment_to_invoice",
        { p_payment_id: pay.id, p_invoice_id: inv.id },
      );
      if (allocErr) {
        console.error("allocate_payment_to_invoice failed:", allocErr.message);
      }
    }
  }

  revalidatePath("/payments");
  revalidatePath("/arrears");
  revalidatePath("/overview");
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
  revalidatePath("/payments");
  revalidatePath("/arrears");
  revalidatePath("/overview");
  return { ok: true };
}
