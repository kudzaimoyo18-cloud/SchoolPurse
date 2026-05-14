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
  if (!profile && user.email) {
    const admin = createAdminClient();
    const res = await admin
      .from("users")
      .select("id, name, email, role, school_id, schools(name)")
      .eq("email", user.email)
      .maybeSingle();
    profile = res.data;
  }

  if (!profile) {
    // Auth user exists but no linked public.users row — likely missing seed.
    redirect("/login?error=no_profile");
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
