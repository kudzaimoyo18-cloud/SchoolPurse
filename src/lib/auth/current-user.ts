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
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Primary lookup: public.users.id == auth.users.id (the normal seeded path)
  let { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, school_id, schools(name)")
    .eq("id", user.id)
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
  if (!profile && user.email) {
    const admin = createAdminClient();
    const res = await admin
      .from("users")
      .select("id, name, email, role, school_id, schools(name)")
      .eq("email", user.email)
      .maybeSingle();
    profile = res.data;

    if (profile && (profile as { id?: string }).id !== user.id) {
      const oldId = (profile as { id: string }).id;
      const { error: syncErr } = await admin
        .from("users")
        .update({ id: user.id })
        .eq("id", oldId);
      if (!syncErr) {
        (profile as { id: string }).id = user.id;
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
}
