"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  }

  redirect("/app/overview");
}
