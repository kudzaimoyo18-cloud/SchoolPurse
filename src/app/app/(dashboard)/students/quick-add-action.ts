"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exceedsStudentLimit, studentLimitMessage } from "@/lib/plan";
import { getPlanAndStudentCount } from "@/lib/plan-server";

export type QuickAddResult =
  | {
      ok: true;
      student: {
        id: string;
        name: string;
        class_name: string | null;
      };
    }
  | { ok: false; error: string };

const Schema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  class_id: z.string().uuid().nullish().or(z.literal("")),
});

/**
 * Lightweight version of enrollChild for the inline "Add new student" path
 * inside the Payments form. Use case: a bursar starts recording a payment
 * for a student who isn't in the database yet (mid-term migration). Rather
 * than abandon the payment form, they can spawn the student with the
 * minimum fields needed (first + last + class) and continue.
 *
 * No invoice is created here — the payment that follows becomes a "credit
 * on account" via the existing unallocated-payment path. The bursar can
 * later open New Registration in carry-over mode to back-fill the student's
 * prior fees if they have outstanding balances.
 */
export async function quickAddStudent(
  formData: FormData,
): Promise<QuickAddResult> {
  const parsed = Schema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    class_id: formData.get("class_id") || null,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
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

  // Plan gate: free schools cap at 100 active students.
  const { plan, activeStudents } = await getPlanAndStudentCount(
    supabase,
    schoolId,
  );
  if (exceedsStudentLimit(plan, activeStudents)) {
    return { ok: false, error: studentLimitMessage(plan) };
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: studentRow, error: insertErr } = await supabase
    .from("students")
    .insert({
      school_id: schoolId,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      class_id: parsed.data.class_id || null,
      enrollment_date: todayIso,
      status: "active",
    })
    .select("id, first_name, last_name, class_id, classes(name)")
    .single();

  if (insertErr || !studentRow) {
    return {
      ok: false,
      error: insertErr?.message ?? "Failed to add student",
    };
  }

  const row = studentRow as {
    id: string;
    first_name: string;
    last_name: string;
    classes: { name?: string } | { name?: string }[] | null;
  };

  const classField = row.classes;
  const className = Array.isArray(classField)
    ? (classField[0]?.name ?? null)
    : (classField?.name ?? null);

  revalidatePath("/app/students");
  revalidatePath("/app/payments");
  revalidatePath("/app/overview");

  return {
    ok: true,
    student: {
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      class_name: className,
    },
  };
}
