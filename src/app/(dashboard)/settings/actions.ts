"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const SchoolInfoSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().nullish(),
  phone: z.string().trim().nullish(),
  currency: z.string().trim().min(1),
  receipt_prefix: z.string().trim().min(1),
  terms_per_year: z.coerce.number().int().min(1).max(6),
});

async function getCurrentSchoolId() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.user.id)
    .maybeSingle();
  return (profile?.school_id as string | undefined) ?? null;
}

export async function updateSchoolInfo(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = SchoolInfoSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || null,
    phone: formData.get("phone") || null,
    currency: formData.get("currency"),
    receipt_prefix: formData.get("receipt_prefix"),
    terms_per_year: formData.get("terms_per_year"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const schoolId = await getCurrentSchoolId();
  if (!schoolId) return { ok: false, error: "No school assigned" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("schools")
    .update({
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      phone: parsed.data.phone ?? null,
      currency: parsed.data.currency,
      receipt_prefix: parsed.data.receipt_prefix,
      terms_per_year: parsed.data.terms_per_year,
    })
    .eq("id", schoolId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/(dashboard)", "layout");
  return { ok: true };
}

const FeeItemSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["tuition", "levy", "sports", "transport", "exam", "other"]),
  amount_usd: z.coerce.number().min(0),
  recurrence: z.enum(["per_term", "per_month", "one_off"]),
  active: z.coerce.boolean().optional(),
  include_on_registration: z.coerce.boolean().optional(),
  applicable_class_ids: z.array(z.string().uuid()).optional(),
});

export async function createFeeItem(
  formData: FormData,
): Promise<ActionResult> {
  const classes = formData.getAll("applicable_class_ids") as string[];
  const parsed = FeeItemSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    amount_usd: formData.get("amount_usd"),
    recurrence: formData.get("recurrence"),
    active: formData.get("active") === "on",
    include_on_registration: formData.get("include_on_registration") === "on",
    applicable_class_ids: classes,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const schoolId = await getCurrentSchoolId();
  if (!schoolId) return { ok: false, error: "No school assigned" };

  const supabase = await createClient();
  const { error } = await supabase.from("fee_items").insert({
    school_id: schoolId,
    name: parsed.data.name,
    type: parsed.data.type,
    amount_usd: parsed.data.amount_usd,
    recurrence: parsed.data.recurrence,
    applicable_class_ids: parsed.data.applicable_class_ids ?? [],
    active: parsed.data.active ?? true,
    include_on_registration: parsed.data.include_on_registration ?? false,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateFeeItem(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const classes = formData.getAll("applicable_class_ids") as string[];
  const parsed = FeeItemSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    amount_usd: formData.get("amount_usd"),
    recurrence: formData.get("recurrence"),
    active: formData.get("active") === "on",
    include_on_registration: formData.get("include_on_registration") === "on",
    applicable_class_ids: classes,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fee_items")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      amount_usd: parsed.data.amount_usd,
      recurrence: parsed.data.recurrence,
      applicable_class_ids: parsed.data.applicable_class_ids ?? [],
      active: parsed.data.active ?? true,
      include_on_registration: parsed.data.include_on_registration ?? false,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function toggleFeeItem(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fee_items")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Generate invoices for every active student for the current term using
 * the active per-term fee items applicable to each student's class.
 * Skips students who already have an invoice for this term.
 */
export async function generateInvoicesForCurrentTerm(): Promise<
  ActionResult<{ invoices: number; skipped: number }>
> {
  const supabase = await createClient();
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) return { ok: false, error: "No school assigned" };

  const { data: term } = await supabase
    .from("terms")
    .select("id, name, start_date, end_date, academic_year_id")
    .eq("is_current", true)
    .maybeSingle();

  if (!term) {
    return {
      ok: false,
      error:
        "No current term is set. Mark a term as current before generating invoices.",
    };
  }

  const t = term as {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };

  const [{ data: students }, { data: feeItems }] = await Promise.all([
    supabase
      .from("students")
      .select("id, class_id, first_name, last_name")
      .eq("status", "active"),
    supabase
      .from("fee_items")
      .select("id, name, amount_usd, applicable_class_ids")
      .eq("active", true)
      .eq("recurrence", "per_term"),
  ]);

  type FeeItem = {
    id: string;
    name: string;
    amount_usd: number | string;
    applicable_class_ids: string[] | null;
  };
  type Student = {
    id: string;
    class_id: string | null;
    first_name: string;
    last_name: string;
  };

  const items = (feeItems ?? []) as FeeItem[];
  const studs = (students ?? []) as Student[];

  let created = 0;
  let skipped = 0;

  for (const s of studs) {
    const applicable = items.filter((f) => {
      const list = f.applicable_class_ids ?? [];
      if (list.length === 0) return true; // global fee
      return s.class_id ? list.includes(s.class_id) : false;
    });
    if (applicable.length === 0) {
      skipped++;
      continue;
    }

    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("student_id", s.id)
      .eq("term_id", t.id)
      .eq("is_registration", false)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    const total = applicable.reduce(
      (sum, f) => sum + Number(f.amount_usd),
      0,
    );

    const { data: inserted, error: invErr } = await supabase
      .from("invoices")
      .insert({
        school_id: schoolId,
        student_id: s.id,
        term_id: t.id,
        period_label: t.name,
        due_date: t.start_date,
        total_usd: total,
        status: "open",
        is_registration: false,
      })
      .select("id")
      .single();

    if (invErr || !inserted) {
      skipped++;
      continue;
    }

    const inv = inserted as { id: string };
    const lines = applicable.map((f) => ({
      invoice_id: inv.id,
      fee_item_id: f.id,
      description: f.name,
      amount_usd: Number(f.amount_usd),
      paid_usd: 0,
    }));

    await supabase.from("invoice_lines").insert(lines);
    created++;
  }

  revalidatePath("/payments");
  revalidatePath("/arrears");
  revalidatePath("/overview");
  return { ok: true, invoices: created, skipped };
}
