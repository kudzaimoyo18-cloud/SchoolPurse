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

/** Returns the caller's profile only if they are an admin of their school. */
async function getAdminContext(): Promise<
  { schoolId: string } | { error: string }
> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Not authenticated" };
  const { data: profile } = await supabase
    .from("users")
    .select("school_id, role")
    .eq("id", user.user.id)
    .maybeSingle();
  const p = profile as
    | { school_id?: string; role?: string }
    | null;
  if (!p?.school_id) return { error: "No school assigned" };
  if (p.role !== "school_admin" && p.role !== "platform_admin") {
    return { error: "Only school admins can change settings." };
  }
  return { schoolId: p.school_id };
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

  const ctx = await getAdminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { schoolId } = ctx;

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
  revalidatePath("/app/settings");
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
  revalidatePath("/app/settings");
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
  revalidatePath("/app/settings");
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
  revalidatePath("/app/settings");
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

  revalidatePath("/app/payments");
  revalidatePath("/app/arrears");
  revalidatePath("/app/overview");
  return { ok: true, invoices: created, skipped };
}

// =============================================================================
// School levels + classes
// =============================================================================

const LEVELS = ["primary", "secondary", "tertiary"] as const;
type Level = (typeof LEVELS)[number];

// Default class catalogue per level. When a school enables Secondary, we
// seed Form 1–6 etc. so the admin doesn't have to type them in. We skip any
// names that already exist (idempotent).
const DEFAULT_CLASSES: Record<Level, string[]> = {
  primary: [
    "ECD A",
    "ECD B",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
  ],
  secondary: [
    "Form 1",
    "Form 2",
    "Form 3",
    "Form 4",
    "Form 5 (Lower 6)",
    "Form 6 (Upper 6)",
  ],
  tertiary: ["Year 1", "Year 2", "Year 3", "Year 4"],
};

const LevelsSchema = z.object({
  levels: z
    .array(z.enum(LEVELS))
    .min(1, "At least one level must be enabled."),
});

/**
 * Update which levels the school operates and seed default classes for any
 * newly enabled level. Disabling a level keeps existing classes intact (the
 * DB trigger would block adding NEW classes for the disabled level, but
 * students/invoices stay safe).
 */
export async function updateSchoolLevels(
  formData: FormData,
): Promise<ActionResult<{ seeded: number }>> {
  const ctx = await getAdminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { schoolId } = ctx;

  const submitted = formData.getAll("levels").map(String);
  const parsed = LevelsSchema.safeParse({ levels: submitted });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  // Load the current set so we can detect which levels are newly enabled and
  // need their default classes seeded.
  const { data: current } = await supabase
    .from("schools")
    .select("levels")
    .eq("id", schoolId)
    .maybeSingle();
  const currentLevels = ((current as { levels?: Level[] } | null)?.levels ??
    []) as Level[];

  const nextLevels = parsed.data.levels;
  const newlyEnabled = nextLevels.filter(
    (l) => !currentLevels.includes(l),
  );

  // 1. Update the schools row first so the class-insert trigger sees the
  //    new levels as valid before we try to add classes for them.
  const { error: updateErr } = await supabase
    .from("schools")
    .update({ levels: nextLevels })
    .eq("id", schoolId);
  if (updateErr) return { ok: false, error: updateErr.message };

  // 2. Seed default classes for any newly enabled level. Skip names that
  //    already exist (e.g. admin already typed in their own Form 1).
  let seeded = 0;
  if (newlyEnabled.length > 0) {
    const { data: existing } = await supabase
      .from("classes")
      .select("name")
      .eq("school_id", schoolId);
    const existingNames = new Set(
      ((existing ?? []) as { name: string }[]).map((c) =>
        c.name.trim().toLowerCase(),
      ),
    );
    const toInsert: { school_id: string; name: string; level: Level }[] = [];
    for (const level of newlyEnabled) {
      for (const className of DEFAULT_CLASSES[level]) {
        if (!existingNames.has(className.trim().toLowerCase())) {
          toInsert.push({ school_id: schoolId, name: className, level });
          existingNames.add(className.trim().toLowerCase());
        }
      }
    }
    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from("classes")
        .insert(toInsert);
      if (insertErr) {
        return {
          ok: false,
          error: "Levels saved but class seeding failed: " + insertErr.message,
        };
      }
      seeded = toInsert.length;
    }
  }

  revalidatePath("/app/settings");
  revalidatePath("/(dashboard)", "layout");
  return { ok: true, seeded };
}

const ClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  level: z.enum(LEVELS),
});

export async function createClass(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getAdminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { schoolId } = ctx;

  const parsed = ClassSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .insert({
      school_id: schoolId,
      name: parsed.data.name,
      level: parsed.data.level,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/settings");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateClass(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = ClassSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ name: parsed.data.name, level: parsed.data.level })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function deleteClass(id: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = await createClient();
  // Defensive: refuse to delete a class that still has students assigned.
  // FK on students.class_id is SET NULL, so deletion wouldn't break data —
  // but the bursar likely meant to reassign, not orphan, so we surface the
  // count.
  const { count } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("class_id", id);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Can't delete — ${count} student${count === 1 ? " is" : "s are"} still in this class. Reassign them first.`,
    };
  }

  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/settings");
  return { ok: true };
}
