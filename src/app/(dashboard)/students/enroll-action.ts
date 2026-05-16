"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EnrollResult =
  | {
      ok: true;
      studentId: string;
      invoiceId: string | null;
      total: number;
    }
  | { ok: false; error: string };

const Schema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  class_id: z.string().uuid().nullish().or(z.literal("")),
  dob: z.string().nullish().or(z.literal("")),
  gender: z.string().nullish().or(z.literal("")),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
  fee_item_ids: z.array(z.string().uuid()).default([]),
});

/**
 * Enroll a new student AND open their registration invoice in one go.
 *
 * The bursar can uncheck items from the school's standard registration
 * bundle, so we don't call `provision_registration_invoice` (which always
 * includes every flagged item). Instead we build the invoice ourselves
 * from the explicit fee_item_ids the bursar confirmed.
 *
 * RLS guards everything: the user must be school_admin/bursar of this
 * school for the inserts to succeed.
 */
export async function enrollChild(
  formData: FormData,
): Promise<EnrollResult> {
  const feeItemIds = formData.getAll("fee_item_ids").map(String);
  const parsed = Schema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    class_id: formData.get("class_id") || null,
    dob: formData.get("dob") || null,
    gender: formData.get("gender") || null,
    enrollment_date: formData.get("enrollment_date"),
    fee_item_ids: feeItemIds.filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    ),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  const schoolId = (profile as { school_id?: string } | null)?.school_id;
  if (!schoolId) return { ok: false, error: "No school assigned" };

  // 1. Insert the student.
  const { data: studentRow, error: studentErr } = await supabase
    .from("students")
    .insert({
      school_id: schoolId,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      class_id: parsed.data.class_id || null,
      dob: parsed.data.dob || null,
      gender: parsed.data.gender || null,
      enrollment_date: parsed.data.enrollment_date,
      status: "active",
    })
    .select("id, class_id")
    .single();

  if (studentErr || !studentRow) {
    return {
      ok: false,
      error: studentErr?.message ?? "Failed to add student",
    };
  }
  const student = studentRow as { id: string; class_id: string | null };

  // No items selected → enrol with no opening invoice. The bursar can
  // charge specific fees later via the existing payment flow.
  if (parsed.data.fee_item_ids.length === 0) {
    revalidatePath("/students");
    revalidatePath("/arrears");
    revalidatePath("/overview");
    return { ok: true, studentId: student.id, invoiceId: null, total: 0 };
  }

  // 2. Look up the selected fee items, validate they belong to this school,
  //    are active, and (if class-restricted) apply to this student's class.
  const { data: feeItemsRaw } = await supabase
    .from("fee_items")
    .select("id, name, amount_usd, applicable_class_ids, active")
    .in("id", parsed.data.fee_item_ids);

  type FeeItem = {
    id: string;
    name: string;
    amount_usd: number | string;
    applicable_class_ids: string[] | null;
    active: boolean;
  };

  const selectedItems = (feeItemsRaw ?? []) as FeeItem[];
  const eligible = selectedItems.filter((f) => {
    if (!f.active) return false;
    const cls = f.applicable_class_ids ?? [];
    if (cls.length === 0) return true;
    return student.class_id ? cls.includes(student.class_id) : false;
  });

  if (eligible.length === 0) {
    // Student saved but no eligible fees — non-fatal.
    revalidatePath("/students");
    revalidatePath("/arrears");
    revalidatePath("/overview");
    return { ok: true, studentId: student.id, invoiceId: null, total: 0 };
  }

  // 3. Resolve current term (optional — invoice can exist without a term).
  const { data: termRow } = await supabase
    .from("terms")
    .select("id, name, start_date")
    .eq("is_current", true)
    .maybeSingle();
  const term = termRow as
    | { id: string; name: string; start_date: string }
    | null;

  const year = new Date().getFullYear();
  const periodLabel = term
    ? `Registration & ${term.name} ${year}`
    : `Registration ${year}`;

  const total = eligible.reduce((sum, f) => sum + Number(f.amount_usd), 0);

  // 4. Create the invoice + lines. We don't use provision_registration_invoice
  //    because we need to honour the bursar's checkbox choices.
  const { data: invoiceRow, error: invErr } = await supabase
    .from("invoices")
    .insert({
      school_id: schoolId,
      student_id: student.id,
      term_id: term?.id ?? null,
      period_label: periodLabel,
      due_date: term?.start_date ?? parsed.data.enrollment_date,
      total_usd: total,
      status: "open",
      is_registration: true,
    })
    .select("id")
    .single();

  if (invErr || !invoiceRow) {
    // Student is saved; surface the invoice error but don't block.
    return {
      ok: false,
      error:
        "Student saved, but the registration invoice failed: " +
        (invErr?.message ?? "unknown"),
    };
  }
  const inv = invoiceRow as { id: string };

  const lines = eligible.map((f) => ({
    invoice_id: inv.id,
    fee_item_id: f.id,
    description: f.name,
    amount_usd: Number(f.amount_usd),
    paid_usd: 0,
  }));

  const { error: linesErr } = await supabase.from("invoice_lines").insert(lines);
  if (linesErr) {
    return {
      ok: false,
      error:
        "Student + invoice saved, but adding the line items failed: " +
        linesErr.message,
    };
  }

  revalidatePath("/students");
  revalidatePath("/arrears");
  revalidatePath("/overview");
  revalidatePath("/payments");

  return {
    ok: true,
    studentId: student.id,
    invoiceId: inv.id,
    total,
  };
}
