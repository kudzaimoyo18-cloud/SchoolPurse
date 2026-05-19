"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LogoResult = { ok: true; path: string } | { ok: false; error: string };

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

async function getAdminCtx(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; schoolId: string; logoPath: string | null }
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
  if (p.role !== "school_admin" && p.role !== "platform_admin") {
    return { error: "Only school admins can change the logo." };
  }
  const { data: school } = await supabase
    .from("schools")
    .select("logo_path")
    .eq("id", p.school_id)
    .maybeSingle();
  return {
    supabase,
    schoolId: p.school_id,
    logoPath: (school as { logo_path?: string | null } | null)?.logo_path ?? null,
  };
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}

export async function uploadSchoolLogo(
  formData: FormData,
): Promise<LogoResult> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick an image to upload." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Logo must be PNG, JPEG, WebP, or SVG.",
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Logo must be 2 MB or smaller." };
  }

  const ctx = await getAdminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, schoolId, logoPath: oldPath } = ctx;

  const ext = extFromMime(file.type);
  // Cache-bust by stamping the filename. The previous file is removed below
  // so we never leak storage on repeated re-uploads.
  const path = `${schoolId}/logo-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("school-logos")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  // Persist new path on the schools row.
  const { error: updErr } = await supabase
    .from("schools")
    .update({ logo_path: path })
    .eq("id", schoolId);
  if (updErr) {
    // Best-effort cleanup of the just-uploaded object so we don't leak.
    await supabase.storage.from("school-logos").remove([path]);
    return { ok: false, error: updErr.message };
  }

  // Remove the previous logo. Don't block on errors here — the row is
  // already pointing at the new file.
  if (oldPath && oldPath !== path) {
    await supabase.storage.from("school-logos").remove([oldPath]);
  }

  revalidatePath("/app/settings");
  revalidatePath("/(dashboard)", "layout");
  revalidatePath("/app/receipts", "layout");
  revalidatePath("/app/invoices", "layout");
  return { ok: true, path };
}

export async function removeSchoolLogo(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const ctx = await getAdminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, schoolId, logoPath } = ctx;
  if (!logoPath) return { ok: true };

  const { error: updErr } = await supabase
    .from("schools")
    .update({ logo_path: null })
    .eq("id", schoolId);
  if (updErr) return { ok: false, error: updErr.message };

  await supabase.storage.from("school-logos").remove([logoPath]);

  revalidatePath("/app/settings");
  revalidatePath("/(dashboard)", "layout");
  revalidatePath("/app/receipts", "layout");
  revalidatePath("/app/invoices", "layout");
  return { ok: true };
}
