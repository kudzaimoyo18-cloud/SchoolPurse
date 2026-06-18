"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SaveReportResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

const LineSchema = z.object({
  subject_id: z.string().uuid().nullable(),
  subject_name: z.string().trim().min(1),
  marks: z.number().min(0).max(100).nullable(),
  rating: z.string().trim().min(1).nullable(),
  comment: z.string().trim().nullable(),
});

const Schema = z.object({
  student_id: z.string().uuid("Pick a student"),
  teacher_comment: z.string().trim().nullish(),
  head_comment: z.string().trim().nullish(),
  attendance_present: z.number().int().min(0).max(400).nullable(),
  attendance_total: z.number().int().min(0).max(400).nullable(),
  lines: z.array(LineSchema).min(1, "Add at least one subject"),
});

/**
 * Create or update a student's report card for the current term. One report per
 * student per term (DB unique index); re-saving replaces the lines. Academic
 * lines carry `marks`; ECD lines carry a `rating` descriptor. RLS restricts
 * writes to school staff of the same school.
 */
export async function saveReportCard(
  payload: unknown,
): Promise<SaveReportResult> {
  const parsed = Schema.safeParse(payload);
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
    .select("id, school_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  const schoolId = (profile as { school_id?: string } | null)?.school_id;
  const userId = (profile as { id?: string } | null)?.id;
  if (!schoolId) return { ok: false, error: "No school assigned" };

  const [{ data: termRow }, { data: studentRow }] = await Promise.all([
    supabase.from("terms").select("id").eq("is_current", true).maybeSingle(),
    supabase
      .from("students")
      .select("id, class_id, school_id")
      .eq("id", parsed.data.student_id)
      .maybeSingle(),
  ]);

  const termId = (termRow as { id?: string } | null)?.id ?? null;
  if (!termId) {
    return {
      ok: false,
      error: "Set a current term before creating report cards.",
    };
  }
  const student = studentRow as
    | { class_id?: string | null; school_id?: string }
    | null;
  if (!student || student.school_id !== schoolId) {
    return { ok: false, error: "Student not found in this school." };
  }

  const base = {
    class_id: student.class_id ?? null,
    teacher_comment: parsed.data.teacher_comment || null,
    head_comment: parsed.data.head_comment || null,
    attendance_present: parsed.data.attendance_present,
    attendance_total: parsed.data.attendance_total,
    updated_at: new Date().toISOString(),
  };

  let reportId: string;
  const { data: existing } = await supabase
    .from("report_cards")
    .select("id")
    .eq("student_id", parsed.data.student_id)
    .eq("term_id", termId)
    .maybeSingle();

  if (existing) {
    reportId = (existing as { id: string }).id;
    const { error } = await supabase
      .from("report_cards")
      .update(base)
      .eq("id", reportId);
    if (error) return { ok: false, error: error.message };
    await supabase
      .from("report_card_lines")
      .delete()
      .eq("report_card_id", reportId);
  } else {
    const { data: ins, error } = await supabase
      .from("report_cards")
      .insert({
        school_id: schoolId,
        student_id: parsed.data.student_id,
        term_id: termId,
        created_by: userId,
        ...base,
      })
      .select("id")
      .single();
    if (error || !ins) {
      return { ok: false, error: error?.message ?? "Failed to create report" };
    }
    reportId = (ins as { id: string }).id;
  }

  const lineRows = parsed.data.lines.map((l) => ({
    school_id: schoolId,
    report_card_id: reportId,
    subject_id: l.subject_id,
    subject_name: l.subject_name,
    marks: l.marks,
    rating: l.rating,
    comment: l.comment || null,
  }));
  const { error: linesErr } = await supabase
    .from("report_card_lines")
    .insert(lineRows);
  if (linesErr) return { ok: false, error: linesErr.message };

  revalidatePath("/app/report-cards");
  return { ok: true, reportId };
}
