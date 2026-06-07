"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkSubscriptionToSchool, getSchoolTier } from "@/lib/subscription";
import { sendWelcomeEmail } from "@/lib/emails/welcome";

export type OnboardingState = { error: string } | null;

const Schema = z.object({
  school_name: z.string().trim().min(2, "School name is required"),
  school_slug: z
    .string()
    .trim()
    .min(2, "School slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens"),
  address: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  currency: z.string().trim().min(1).default("USD"),
  terms_per_year: z.coerce.number().int().min(1).max(6).default(3),
  receipt_prefix: z
    .string()
    .trim()
    .min(2, "Prefix is required")
    .max(8, "Prefix must be 8 characters or fewer")
    .regex(/^[A-Z0-9]+$/, "Use uppercase letters and digits only"),
  admin_name: z.string().trim().min(2, "Your name is required"),
  admin_phone: z.string().trim().optional().or(z.literal("")),
  seed_defaults: z.coerce.boolean().optional(),
});

/**
 * Seed a current academic year + terms so the school can invoice immediately.
 * There is no self-service UI for academic years/terms yet, and a brand-new
 * school has none (seed_school_defaults only creates subjects + expense
 * categories), so onboarding sets up the current year and splits it into
 * `termsPerYear` terms, marking the one containing today as current.
 * No-op if a year already exists.
 */
async function seedYearAndTerms(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
  termsPerYear: number,
): Promise<void> {
  const { data: existing } = await admin
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const now = new Date();
  const year = now.getUTCFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

  const { data: ay, error: ayErr } = await admin
    .from("academic_years")
    .insert({
      school_id: schoolId,
      name: String(year),
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
      is_current: true,
    })
    .select("id")
    .single();
  if (ayErr || !ay) return;

  const n = Math.min(Math.max(termsPerYear, 1), 6);
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const terms: Array<{
    school_id: string;
    academic_year_id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
  }> = [];
  for (let i = 0; i < n; i++) {
    const startMonth = Math.floor((i * 12) / n);
    const endMonthExcl = Math.floor(((i + 1) * 12) / n);
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, endMonthExcl, 0));
    terms.push({
      school_id: schoolId,
      academic_year_id: (ay as { id: string }).id,
      name: `Term ${i + 1}`,
      start_date: fmt(start),
      end_date: fmt(end),
      is_current: todayMs >= start.getTime() && todayMs <= end.getTime(),
    });
  }
  if (!terms.some((t) => t.is_current) && terms.length > 0) {
    terms[0].is_current = true;
  }
  await admin.from("terms").insert(terms);
}

export async function provisionMySchool(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = Schema.safeParse({
    school_name: formData.get("school_name"),
    school_slug: formData.get("school_slug"),
    address: formData.get("address") || "",
    phone: formData.get("phone") || "",
    currency: formData.get("currency") || "USD",
    terms_per_year: formData.get("terms_per_year") || 3,
    receipt_prefix: formData.get("receipt_prefix"),
    admin_name: formData.get("admin_name"),
    admin_phone: formData.get("admin_phone") || "",
    seed_defaults: formData.get("seed_defaults") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { error: "Not authenticated. Please sign in again." };
  }

  // Guard: if the user already has a public.users row (matched either by
  // their auth id OR by email), don't double-provision. Two separate
  // queries — avoids interpolating user.email into PostgREST's .or() filter
  // syntax even though auth.users.email is RFC-validated.
  const admin = createAdminClient();
  const [byId, byEmail] = await Promise.all([
    admin.from("users").select("id").eq("id", user.id).maybeSingle(),
    admin.from("users").select("id").eq("email", user.email).maybeSingle(),
  ]);
  if (byId.data || byEmail.data) {
    redirect("/app/overview");
  }

  // SECURITY — pay-first gate. The /onboarding PAGE also checks this, but a
  // page only controls what's rendered; this server action is an invocable
  // endpoint. Without re-checking here, anyone holding a magic-link session
  // (which /welcome hands out to any email) could POST straight to this action
  // and provision a school without paying. Enforce it server-side.
  const { data: paidSub } = await admin
    .from("whop_subscriptions")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .eq("status", "active")
    .maybeSingle();
  if (!paidSub) {
    return {
      error:
        "We couldn't find an active subscription for your account. Please complete checkout first, then try again.",
    };
  }

  // Pre-flight: slug must be unique across all schools.
  const { data: slugClash } = await admin
    .from("schools")
    .select("id")
    .eq("slug", parsed.data.school_slug)
    .maybeSingle();
  if (slugClash) {
    return {
      error: "That school slug is already taken. Try a different one.",
    };
  }

  // Call provision_school from the user's AUTHED client — the function is
  // SECURITY DEFINER but checks auth.uid() == p_user_id internally.
  // It creates schools + users rows AND seeds defaults (fee items,
  // classes, expense categories, current academic year + term).
  const { data: rpcResult, error: rpcErr } = await supabase.rpc(
    "provision_school",
    {
      p_user_id: user.id,
      p_school_name: parsed.data.school_name,
      p_school_slug: parsed.data.school_slug,
      p_admin_email: user.email,
      p_admin_name: parsed.data.admin_name,
      p_admin_phone: parsed.data.admin_phone || null,
    },
  );

  if (rpcErr) {
    return { error: rpcErr.message };
  }

  // provision_school returns the new school's uuid. Fall back to a slug
  // lookup if the result shape is unexpected.
  let schoolId =
    typeof rpcResult === "string" && rpcResult.length === 36
      ? rpcResult
      : null;
  if (!schoolId) {
    const { data: school } = await admin
      .from("schools")
      .select("id")
      .eq("slug", parsed.data.school_slug)
      .maybeSingle();
    schoolId = (school as { id: string } | null)?.id ?? null;
  }

  if (!schoolId) {
    return {
      error:
        "School was created but its id couldn't be confirmed. Try refreshing.",
    };
  }

  // Apply the extra fields provision_school doesn't accept and flip the
  // school out of 'trial' into 'active' since the user has actively
  // signed up. Service-role bypasses RLS for this update.
  await admin
    .from("schools")
    .update({
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      currency: parsed.data.currency || "USD",
      terms_per_year: parsed.data.terms_per_year,
      receipt_prefix: parsed.data.receipt_prefix,
      status: "active",
    })
    .eq("id", schoolId);

  // If the user opted OUT of default seed, wipe the data
  // provision_school just seeded so they get a blank slate.
  if (!parsed.data.seed_defaults) {
    await admin.from("fee_items").delete().eq("school_id", schoolId);
    await admin.from("expense_categories").delete().eq("school_id", schoolId);
    await admin.from("classes").delete().eq("school_id", schoolId);
    await admin.from("terms").delete().eq("school_id", schoolId);
    await admin.from("academic_years").delete().eq("school_id", schoolId);
  } else {
    // Give the school a usable starting point: a current academic year + terms.
    await seedYearAndTerms(admin, schoolId, parsed.data.terms_per_year);
  }

  // Auto-link any Whop subscription purchased with this email
  if (user.email) {
    await linkSubscriptionToSchool(user.email);
  }

  // Welcome email — fires once the school is provisioned. No-ops if Resend
  // isn't configured and never throws, so it can't block the redirect.
  const tier = await getSchoolTier(schoolId);
  await sendWelcomeEmail({
    to: user.email,
    recipientName: parsed.data.admin_name,
    schoolName: parsed.data.school_name,
    tier,
  });

  redirect("/app/overview");
}
