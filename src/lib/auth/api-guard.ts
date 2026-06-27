import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

/**
 * Authorise a request inside an API route handler.
 *
 * Route handlers can't use `requireRole` (it `redirect()`s, which is for pages).
 * The proxy middleware already blocks unauthenticated requests to /api/*, but
 * these CSV exports carry financial PII, so we add an explicit in-handler check
 * as defence-in-depth: confirm the caller is signed in AND holds an allowed
 * role. RLS still scopes the underlying data to the caller's own school.
 *
 * Returns the caller's id/role/school on success, or a ready-to-return
 * 401/403 Response on failure.
 */
export type ApiAuthResult =
  | { ok: true; userId: string; role: UserRole; schoolId: string | null }
  | { ok: false; response: Response };

function deny(status: number, error: string): { ok: false; response: Response } {
  return {
    ok: false,
    response: new Response(JSON.stringify({ error }), {
      status,
      headers: { "content-type": "application/json" },
    }),
  };
}

export async function authorizeApi(
  allowed: ReadonlyArray<UserRole>,
): Promise<ApiAuthResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return deny(401, "Not signed in.");

  const { data: profile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", userId)
    .maybeSingle();

  const role = (profile as { role?: UserRole } | null)?.role;
  const schoolId =
    (profile as { school_id?: string | null } | null)?.school_id ?? null;

  if (!role || !allowed.includes(role)) return deny(403, "Forbidden.");

  return { ok: true, userId, role, schoolId };
}

/** Roles permitted to view/export financial data, matching the page gates. */
export const FINANCE_ROLES: ReadonlyArray<UserRole> = [
  "platform_admin",
  "school_admin",
  "bursar",
];
