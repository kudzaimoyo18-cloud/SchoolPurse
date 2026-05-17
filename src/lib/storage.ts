import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Public URL for the school-logos bucket. The bucket is public so we can
 * embed it on printable receipts and invoices without needing the parent to
 * be authed.
 */
export async function getLogoUrl(
  logoPath: string | null | undefined,
): Promise<string | null> {
  if (!logoPath) return null;
  const supabase = await createClient();
  const { data } = supabase.storage
    .from("school-logos")
    .getPublicUrl(logoPath);
  return data?.publicUrl ?? null;
}

/**
 * Signed URL for a private student photo. Default TTL = 1 hour, plenty for
 * a page render. Returns null if the path is empty or signing fails.
 */
export async function getStudentPhotoUrl(
  photoPath: string | null | undefined,
  ttlSeconds = 3600,
): Promise<string | null> {
  if (!photoPath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("student-photos")
    .createSignedUrl(photoPath, ttlSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Batch signed URL generator for the students table — does a single API
 * call instead of N. Returns a Map<photoPath, url>.
 */
export async function getStudentPhotoUrls(
  photoPaths: string[],
  ttlSeconds = 3600,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const paths = photoPaths.filter((p): p is string => !!p);
  if (paths.length === 0) return result;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("student-photos")
    .createSignedUrls(paths, ttlSeconds);
  if (!data) return result;
  for (const row of data) {
    if (row.path && row.signedUrl) {
      result.set(row.path, row.signedUrl);
    }
  }
  return result;
}
