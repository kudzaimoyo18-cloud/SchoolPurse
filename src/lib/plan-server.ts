import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlan, type Plan } from "@/lib/plan";

// Server-side plan + usage lookups, used by the gates in the student and team
// actions. Takes an existing Supabase client (RLS or admin) so callers don't
// spin up a second one.

export async function getPlanAndStudentCount(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ plan: Plan; activeStudents: number }> {
  const [{ data: school }, { count }] = await Promise.all([
    supabase.from("schools").select("plan").eq("id", schoolId).maybeSingle(),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "active"),
  ]);
  return {
    plan: normalizePlan((school as { plan?: string } | null)?.plan),
    activeStudents: count ?? 0,
  };
}

export async function getPlanAndUserCount(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ plan: Plan; userCount: number }> {
  const [{ data: school }, { count }] = await Promise.all([
    supabase.from("schools").select("plan").eq("id", schoolId).maybeSingle(),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId),
  ]);
  return {
    plan: normalizePlan((school as { plan?: string } | null)?.plan),
    userCount: count ?? 0,
  };
}
