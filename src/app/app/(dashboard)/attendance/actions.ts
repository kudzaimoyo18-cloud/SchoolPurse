"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SaveAttendanceResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const MarkSchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "excused"]),
});

const Schema = z.object({
  class_id: z.string().uuid().nullable(),
  date: z.string().regex(ISO_DATE, "Pick a valid date"),
  marks: z.array(MarkSchema).min(1, "Mark at least one student"),
});

/**
 * Save (upsert) the daily register for a class. One row per student per date;
 * re-marking the same day updates the status. RLS restricts writes to school
 * staff of the same school.
 */
export async function saveAttendance(
  payload: unknown,
): Promise<SaveAttendanceResult> {
  const parsed = Schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  // Don't allow marking a register for a future date.
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.date > today) {
    return { ok: false, error: "You can't mark attendance for a future date." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("users")
    .select("id, school_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  const schoolId = (profile as { school_id?: string } | null)?.school_id;
  const userId = (profile as { id?: string } | null)?.id;
  if (!schoolId) return { ok: false, error: "No school assigned" };

  const now = new Date().toISOString();
  const rows = parsed.data.marks.map((m) => ({
    school_id: schoolId,
    student_id: m.student_id,
    class_id: parsed.data.class_id,
    date: parsed.data.date,
    status: m.status,
    marked_by: userId,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "student_id,date" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/attendance");
  revalidatePath("/app/report-cards");
  return { ok: true, count: rows.length };
}
