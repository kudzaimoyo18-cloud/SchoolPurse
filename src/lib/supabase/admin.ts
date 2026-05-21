import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-side admin client that bypasses RLS.
 *
 * Key migration (May 2026): Supabase split its API key system into the new
 * `sb_secret_*` scheme (rotatable per-key, no JWT secret involved) and the
 * legacy `service_role` JWT (rotation logs out every user). We prefer the
 * new one; the legacy fallback exists so the migration is a zero-downtime
 * env-var swap in Vercel rather than a coordinated deploy.
 *
 * Cutover plan:
 *   1. Set SUPABASE_SECRET_KEY in Vercel (sb_secret_* value).
 *   2. Verify in production.
 *   3. Delete SUPABASE_SERVICE_ROLE_KEY in Vercel.
 *   4. Eventually click "Disable legacy API keys" in Supabase → API Keys.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
