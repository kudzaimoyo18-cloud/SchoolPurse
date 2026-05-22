"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM } from "@/lib/resend";

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
    status: "invited",
  });

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  // 4. Send welcome email via Resend (no-ops gracefully if not configured).
  const resend = getResend();
  if (resend) {
    const { data: schoolRow } = await admin
      .from("schools")
      .select("name")
      .eq("id", schoolId)
      .maybeSingle();
    const schoolName =
      (schoolRow as { name?: string } | null)?.name ?? "your school";
    const roleLabel =
      parsed.data.role === "school_admin"
        ? "Head / Admin"
        : parsed.data.role === "bursar"
          ? "Bursar"
          : "Teacher";
    const loginUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? "https://schoolpurse.vercel.app") +
      "/login";

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: parsed.data.email,
        subject: `You've been invited to ${schoolName} on SchoolPurse`,
        html: buildInviteEmailHtml({
          recipientName: parsed.data.name,
          schoolName,
          role: roleLabel,
          loginUrl,
        }),
      });
    } catch (err) {
      // Don't fail the invite if email fails — the user row is already created.
      console.error("Failed to send invite email:", err);
    }
  }

  revalidatePath("/app/settings");
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

  revalidatePath("/app/settings");
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
  revalidatePath("/app/settings");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Invite email template                                              */
/* ------------------------------------------------------------------ */

function buildInviteEmailHtml({
  recipientName,
  schoolName,
  role,
  loginUrl,
}: {
  recipientName: string;
  schoolName: string;
  role: string;
  loginUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="padding:24px 28px;border-bottom:3px solid #10b981;">
      <img src="https://schoolpurse.vercel.app/logo.png" alt="SchoolPurse" width="140" style="margin-bottom:16px;"/>
      <h1 style="margin:0;font-size:20px;color:#18181b;">You&rsquo;re invited!</h1>
    </div>
    <div style="padding:24px 28px;font-size:15px;line-height:1.6;color:#3f3f46;">
      <p style="margin:0 0 12px;">Hi ${esc(recipientName)},</p>
      <p style="margin:0 0 16px;">
        You&rsquo;ve been added to <strong>${esc(schoolName)}</strong> on SchoolPurse
        as a <strong>${esc(role)}</strong>.
      </p>
      <p style="margin:0 0 20px;">
        SchoolPurse is the finance tool your school uses to track fees,
        payments, receipts, and arrears. Click below to sign in and get started:
      </p>
      <a href="${esc(loginUrl)}"
         style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Sign in to SchoolPurse
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#71717a;">
        Use &ldquo;Continue with Google&rdquo; with your <strong>${esc(recipientName)}</strong> email address.
        If you don&rsquo;t recognise this invitation, you can safely ignore this email.
      </p>
      <p style="margin:16px 0 0;color:#71717a;font-size:13px;">
        &mdash; The SchoolPurse Team
      </p>
    </div>
    <div style="padding:16px 28px;background:#fafafa;font-size:11px;color:#a1a1aa;text-align:center;">
      You&rsquo;re receiving this because ${esc(schoolName)} added you as a team member.
    </div>
  </div>
</body>
</html>`.trim();
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
