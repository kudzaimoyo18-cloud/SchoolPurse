"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeamResult = { ok: true } | { ok: false; error: string };

const InviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  name: z.string().trim().min(2, "Name is required"),
  role: z.enum(["school_admin", "bursar", "teacher"]),
});

type Caller = { userId: string; schoolId: string; role: string };

/**
 * Returns the caller's id, school and role. Returns null if not signed in,
 * not linked to a school, or not an admin (school_admin / platform_admin).
 * Every team action MUST gate on the admin requirement because team-actions
 * use the service-role client (which bypasses RLS).
 */
async function requireAdminCaller(): Promise<
  { ok: true; caller: Caller } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("users")
    .select("id, school_id, role")
    .eq("id", user.user.id)
    .maybeSingle();

  if (!profile || !(profile as { school_id?: string }).school_id) {
    return { ok: false, error: "No school assigned." };
  }
  const p = profile as { id: string; school_id: string; role: string };
  if (p.role !== "school_admin" && p.role !== "platform_admin") {
    return {
      ok: false,
      error: "Only school admins can manage the team.",
    };
  }
  return {
    ok: true,
    caller: { userId: p.id, schoolId: p.school_id, role: p.role },
  };
}

export async function inviteTeammate(formData: FormData): Promise<TeamResult> {
  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireAdminCaller();
  if (!auth.ok) return auth;
  const schoolId = auth.caller.schoolId;

  const admin = createAdminClient();

  // 1. If a public.users row with this email already exists, refuse — we
  //    don't want to silently move someone from another school.
  const { data: existing } = await admin
    .from("users")
    .select("id, school_id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (existing) {
    if ((existing as { school_id: string }).school_id === schoolId) {
      return {
        ok: false,
        error: "This person is already on your team.",
      };
    }
    return {
      ok: false,
      error:
        "This email is already in use on a different school. Ask them to remove themselves first.",
    };
  }

  // 2. Create the auth user (or look up the existing one if Supabase has it).
  //    email_confirm:true means they can sign in with Google immediately.
  const { data: authCreate, error: authErr } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.name, invited: true },
    });

  let authUserId = authCreate?.user?.id ?? null;

  if (authErr) {
    if (/already.*registered|already.*exists|already been registered/i.test(authErr.message)) {
      // Page through auth.users to find them by email. Caps at ~10000 users
      // (50 pages * 200/page) — more than enough headroom for our scale.
      const target = parsed.data.email;
      const PER_PAGE = 200;
      const MAX_PAGES = 50;
      let found: { id: string; email?: string | null } | null = null;
      for (let page = 1; page <= MAX_PAGES && !found; page++) {
        const { data: list, error: listErr } =
          await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
        if (listErr) return { ok: false, error: listErr.message };
        if (!list?.users?.length) break;
        found =
          list.users.find((u) => u.email?.toLowerCase() === target) ?? null;
        if (list.users.length < PER_PAGE) break;
      }
      authUserId = found?.id ?? null;
      if (!authUserId) {
        return {
          ok: false,
          error:
            "An auth user with that email already exists but we couldn't locate it. Try again.",
        };
      }
    } else {
      return { ok: false, error: authErr.message };
    }
  }

  if (!authUserId) {
    return { ok: false, error: "Could not create or find the auth user." };
  }

  // 3. Insert the public.users row linking them to this school.
  const { error: insertErr } = await admin.from("users").insert({
    id: authUserId,
    school_id: schoolId,
    role: parsed.data.role,
    name: parsed.data.name,
    email: parsed.data.email,
    status: "active",
  });

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeTeammate(userId: string): Promise<TeamResult> {
  const auth = await requireAdminCaller();
  if (!auth.ok) return auth;
  if (auth.caller.userId === userId) {
    return { ok: false, error: "You can't remove yourself." };
  }
  const schoolId = auth.caller.schoolId;

  const admin = createAdminClient();

  // Safety: ensure the target row actually belongs to my school.
  const { data: target } = await admin
    .from("users")
    .select("id, school_id, role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "User not found." };
  if ((target as { school_id: string }).school_id !== schoolId) {
    return { ok: false, error: "That user isn't on your school." };
  }

  const { error } = await admin.from("users").delete().eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function changeTeammateRole(
  userId: string,
  role: "school_admin" | "bursar" | "teacher",
): Promise<TeamResult> {
  const auth = await requireAdminCaller();
  if (!auth.ok) return auth;
  if (auth.caller.userId === userId) {
    return { ok: false, error: "You can't change your own role." };
  }
  const schoolId = auth.caller.schoolId;

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("users")
    .select("school_id")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "User not found." };
  if ((target as { school_id: string }).school_id !== schoolId) {
    return { ok: false, error: "That user isn't on your school." };
  }

  const { error } = await admin.from("users").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
