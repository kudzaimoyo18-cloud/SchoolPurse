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

const UniformItemSchema = z.object({
  fee_item_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

const Schema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  class_id: z.string().uuid().nullish().or(z.literal("")),
  dob: z.string().nullish().or(z.literal("")),
  gender: z.string().nullish().or(z.literal("")),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
  fee_item_ids: z.array(z.string().uuid()).default([]),
  uniform_items: z.array(UniformItemSchema).default([]),
});

/**
 * Enroll a new student AND open their registration invoice in one go.
 *
 * The bursar can uncheck items from the school's standard registration
 * bundle, so we don't call `provision_registration_invoice` (which always
 * includes every flagged item). Instead we build the invoice ourselves
 * from the explicit fee_item_ids the bursar confirmed.
 *
 * Uniform items are added with quantities — each creates one invoice
 * line with amount = unit_price × quantity.
 *
 * RLS guards everything: the user must be school_admin/bursar of this
 * school for the inserts to succeed.
 */
export async function enrollChild(
  formData: FormData,
): Promise<EnrollResult> {
  const feeItemIds = formData.getAll("fee_item_ids").map(String);

  // Parse uniform_items JSON from formData
  let uniformItems: Array<{ fee_item_id: string; quantity: number }> = [];
  try {
    const raw = formData.get("uniform_items");
    if (raw && typeof raw === "string" && raw !== "[]") {
      uniformItems = JSON.parse(raw);
    }
  } catch {
    return { ok: false, error: "Malformed uniform items payload." };
  }

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
    uniform_items: uniformItems,
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

  // Gather all fee item IDs we need to look up (registration + uniform)
  const allFeeItemIds = [
    ...parsed.data.fee_item_ids,
    ...parsed.data.uniform_items.map((u) => u.fee_item_id),
  ];

  // No items selected → enrol with no opening invoice.
  if (allFeeItemIds.length === 0) {
    revalidatePath("/app/students");
    revalidatePath("/app/arrears");
    revalidatePath("/app/overview");
    return { ok: true, studentId: student.id, invoiceId: null, total: 0 };
  }

  // 2. Look up all fee items, validate they belong to this school and are active.
  const { data: feeItemsRaw } = await supabase
    .from("fee_items")
    .select("id, name, type, amount_usd, applicable_class_ids, active")
    .in("id", allFeeItemIds);

  type FeeItem = {
    id: string;
    name: string;
    type: string;
    amount_usd: number | string;
    applicable_class_ids: string[] | null;
    active: boolean;
  };

  const allItems = (feeItemsRaw ?? []) as FeeItem[];
  const itemById = new Map(allItems.map((f) => [f.id, f]));

  // Filter registration fee items (non-uniform): must be active + class-applicable
  const eligibleFees = allItems
    .filter((f) => f.type !== "uniform" && parsed.data.fee_item_ids.includes(f.id))
    .filter((f) => {
      if (!f.active) return false;
      const cls = f.applicable_class_ids ?? [];
      if (cls.length === 0) return true;
      return student.class_id ? cls.includes(student.class_id) : false;
    });

  // Validate uniform items: must be active + type=uniform
  const eligibleUniforms = parsed.data.uniform_items
    .map((u) => {
      const item = itemById.get(u.fee_item_id);
      if (!item || !item.active || item.type !== "uniform") return null;
      return { ...item, quantity: u.quantity };
    })
    .filter(
      (u): u is FeeItem & { quantity: number } => u !== null,
    );

  if (eligibleFees.length === 0 && eligibleUniforms.length === 0) {
    revalidatePath("/app/students");
    revalidatePath("/app/arrears");
    revalidatePath("/app/overview");
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

  // Calculate totals
  const feeTotal = eligibleFees.reduce(
    (sum, f) => sum + Number(f.amount_usd),
    0,
  );
  const uniformTotal = eligibleUniforms.reduce(
    (sum, u) => sum + Number(u.amount_usd) * u.quantity,
    0,
  );
  const total = feeTotal + uniformTotal;

  // Due date: 14 days after enrolment, or the term start date if that's later.
  const enrollDate = parsed.data.enrollment_date;
  const enrollPlus14 = new Date(enrollDate + "T00:00:00Z");
  enrollPlus14.setUTCDate(enrollPlus14.getUTCDate() + 14);
  const dueDate =
    term?.start_date &&
    term.start_date > enrollPlus14.toISOString().slice(0, 10)
      ? term.start_date
      : enrollPlus14.toISOString().slice(0, 10);

  // 4. Create the invoice + lines.
  const { data: invoiceRow, error: invErr } = await supabase
    .from("invoices")
    .insert({
      school_id: schoolId,
      student_id: student.id,
      term_id: term?.id ?? null,
      period_label: periodLabel,
      due_date: dueDate,
      total_usd: total,
      status: "open",
      is_registration: true,
    })
    .select("id")
    .single();

  if (invErr || !invoiceRow) {
    return {
      ok: false,
      error:
        "Student saved, but the registration invoice failed: " +
        (invErr?.message ?? "unknown"),
    };
  }
  const inv = invoiceRow as { id: string };

  // Build invoice lines: registration fees (1 line each) + uniforms (1 line each with qty × price)
  const feeLines = eligibleFees.map((f) => ({
    invoice_id: inv.id,
    fee_item_id: f.id,
    description: f.name,
    amount_usd: Number(f.amount_usd),
    paid_usd: 0,
  }));

  const uniformLines = eligibleUniforms.map((u) => ({
    invoice_id: inv.id,
    fee_item_id: u.id,
    description: u.quantity > 1 ? `${u.name} ×${u.quantity}` : u.name,
    amount_usd: Number(u.amount_usd) * u.quantity,
    paid_usd: 0,
  }));

  const allLines = [...feeLines, ...uniformLines];

  const { error: linesErr } = await supabase
    .from("invoice_lines")
    .insert(allLines);
  if (linesErr) {
    return {
      ok: false,
      error:
        "Student + invoice saved, but adding the line items failed: " +
        linesErr.message,
    };
  }

  revalidatePath("/app/students");
  revalidatePath("/app/arrears");
  revalidatePath("/app/overview");
  revalidatePath("/app/payments");

  return {
    ok: true,
    studentId: student.id,
    invoiceId: inv.id,
    total,
  };
}
