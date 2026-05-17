"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PhotoResult = { ok: true; path: string } | { ok: false; error: string };

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — kids photos may be larger

async function getFinanceCtx(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; schoolId: string }
  | { error: string }
> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Not authenticated" };
  const { data: profile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", user.user.id)
    .maybeSingle();
  const p = profile as { role?: string; school_id?: string } | null;
  if (!p?.school_id) return { error: "No school assigned" };
  if (
    p.role !== "school_admin" &&
    p.role !== "platform_admin" &&
    p.role !== "bursar"
  ) {
    return { error: "Only admins and bursars can manage student photos." };
  }
  return { supabase, schoolId: p.school_id };
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function uploadStudentPhoto(
  studentId: string,
  formData: FormData,
): Promise<PhotoResult> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a photo to upload." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Photo must be PNG, JPEG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Photo must be 4 MB or smaller." };
  }
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) {
    return { ok: false, error: "Invalid student id." };
  }

  const ctx = await getFinanceCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, schoolId } = ctx;

  // Confirm the student is in this school before touching storage.
  const { data: studentRow } = await supabase
    .from("students")
    .select("id, school_id, photo_path")
    .eq("id", studentId)
    .maybeSingle();
  const s = studentRow as
    | { id: string; school_id: string; photo_path: string | null }
    | null;
  if (!s || s.school_id !== schoolId) {
    return { ok: false, error: "Student not found in this school." };
  }

  const ext = extFromMime(file.type);
  const path = `${schoolId}/${studentId}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("student-photos")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: updErr } = await supabase
    .from("students")
    .update({ photo_path: path })
    .eq("id", studentId);
  if (updErr) {
    await supabase.storage.from("student-photos").remove([path]);
    return { ok: false, error: updErr.message };
  }

  if (s.photo_path && s.photo_path !== path) {
    await supabase.storage.from("student-photos").remove([s.photo_path]);
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  return { ok: true, path };
}

export async function removeStudentPhoto(
  studentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) {
    return { ok: false, error: "Invalid student id." };
  }
  const ctx = await getFinanceCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, schoolId } = ctx;

  const { data: studentRow } = await supabase
    .from("students")
    .select("id, school_id, photo_path")
    .eq("id", studentId)
    .maybeSingle();
  const s = studentRow as
    | { id: string; school_id: string; photo_path: string | null }
    | null;
  if (!s || s.school_id !== schoolId) {
    return { ok: false, error: "Student not found in this school." };
  }
  if (!s.photo_path) return { ok: true };

  const { error: updErr } = await supabase
    .from("students")
    .update({ photo_path: null })
    .eq("id", studentId);
  if (updErr) return { ok: false, error: updErr.message };

  await supabase.storage.from("student-photos").remove([s.photo_path]);

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  return { ok: true };
}
