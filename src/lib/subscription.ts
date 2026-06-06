import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/lib/whop";

/**
 * Try to link a Whop subscription to a school by matching the customer
 * email to a user in our system. Called both from the webhook handler
 * (when payment arrives for an existing user) and from onboarding
 * (when a new user signs up after paying).
 */
export async function linkSubscriptionToSchool(email: string): Promise<void> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("whop_subscriptions")
    .select("id, tier, school_id")
    .eq("email", email.toLowerCase())
    .eq("status", "active")
    .is("school_id", null)
    .maybeSingle();

  if (!sub) return;

  const { data: user } = await admin
    .from("users")
    .select("school_id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!user?.school_id) return;

  await admin
    .from("whop_subscriptions")
    .update({ school_id: user.school_id })
    .eq("id", sub.id);

  await admin
    .from("schools")
    .update({ subscription_tier: sub.tier })
    .eq("id", user.school_id);
}

/**
 * Downgrade a school when its Whop membership is deactivated.
 */
export async function deactivateSubscription(
  membershipId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("whop_subscriptions")
    .select("id, school_id")
    .eq("membership_id", membershipId)
    .maybeSingle();

  if (!sub) return;

  await admin
    .from("whop_subscriptions")
    .update({ status: "cancelled" })
    .eq("id", sub.id);

  if (sub.school_id) {
    const { data: activeSub } = await admin
      .from("whop_subscriptions")
      .select("id")
      .eq("school_id", sub.school_id)
      .eq("status", "active")
      .neq("id", sub.id)
      .maybeSingle();

    if (!activeSub) {
      await admin
        .from("schools")
        .update({ subscription_tier: "free" })
        .eq("id", sub.school_id);
    }
  }
}

/**
 * Get the current subscription tier for a school.
 */
export async function getSchoolTier(
  schoolId: string,
): Promise<SubscriptionTier> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("schools")
    .select("subscription_tier")
    .eq("id", schoolId)
    .single();

  return (data?.subscription_tier as SubscriptionTier) ?? "free";
}
