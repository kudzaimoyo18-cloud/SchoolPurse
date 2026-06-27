import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string | null;
  schoolName: string | null;
}

/**
 * Returns the signed-in user's profile (joining auth.users → public.users → public.schools).
 * Redirects to /login if not authenticated or if no matching public.users row exists.
 *
 * Wrapped in React `cache()` so it runs at most once per server request, even
 * though the layout and each page (directly or via `requireRole`) all call it.
 * This collapses 2–3 auth + `users` lookups per render into one.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();

  // The proxy middleware already calls getUser() on every request, which
  // validates the token against the auth server AND refreshes the session
  // cookie. Here we only need the identity, so use getClaims() — it verifies
  // the JWT locally (no network round-trip) when the project uses asymmetric
  // signing keys, and transparently falls back to a server call otherwise.
  // This removes one Supabase-auth round-trip from every page render, which
  // is what compounds across page-to-page navigation.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;
  const userEmail =
    typeof claims?.email === "string" ? (claims.email as string) : null;

  if (claimsError || !userId) {
    redirect("/login");
  }

  // Primary lookup: public.users.id == auth.users.id (the normal seeded path)
  let { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, school_id, schools(name)")
    .eq("id", userId)
    .maybeSingle();

  // Fallback: lookup by email via the admin (service-role) client so RLS
  // doesn't block us. Catches the case where the seeded public.users row
  // uses a different UUID than what Supabase assigned when the user
  // actually signed in.
  //
  // When the row's id != auth.users.id we MUST also sync the id, because
  // every downstream RLS policy uses auth.uid() to scope. Without the sync
  // the user lands in an empty dashboard. ON UPDATE CASCADE was added to
  // every FK referencing users.id in a prior migration so this is safe.
  if (!profile && userEmail) {
    const admin = createAdminClient();
    const res = await admin
      .from("users")
      .select("id, name, email, role, school_id, schools(name)")
      .eq("email", userEmail)
      .maybeSingle();
    profile = res.data;

    if (profile && (profile as { id?: string }).id !== userId) {
      const oldId = (profile as { id: string }).id;
      const { error: syncErr } = await admin
        .from("users")
        .update({ id: userId })
        .eq("id", oldId);
      if (!syncErr) {
        (profile as { id: string }).id = userId;
      }
      // On error, leave the profile id mismatched — downstream RLS reads
      // will return empty, but at least the user sees the no_profile flow
      // and we don't 500.
    }
  }

  if (!profile) {
    // Auth user exists but no linked public.users row — they're a new
    // signup. Route them to the onboarding flow to create their school.
    redirect("/onboarding");
  }

  // Auto-activate invited users on first login.
  if ((profile as { status?: string }).status === "invited") {
    const admin = createAdminClient();
    await admin
      .from("users")
      .update({ status: "active" })
      .eq("id", profile.id as string);
  }

  const schoolName = Array.isArray(profile.schools)
    ? (profile.schools[0] as { name?: string } | undefined)?.name ?? null
    : ((profile.schools as { name?: string } | null)?.name ?? null);

  return {
    id: profile.id as string,
    email: profile.email as string,
    name: profile.name as string,
    role: profile.role as UserRole,
    schoolId: (profile.school_id as string | null) ?? null,
    schoolName,
  };
});

/**
 * Like getCurrentUser, but redirects to the dashboard home if the user's role
 * isn't in `allowed`. Use at the top of role-restricted pages so non-permitted
 * roles never see the content (defense-in-depth alongside RLS + action gates).
 */
export async function requireRole(
  allowed: ReadonlyArray<UserRole>,
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!allowed.includes(user.role)) {
    redirect("/app/overview");
  }
  return user;
}