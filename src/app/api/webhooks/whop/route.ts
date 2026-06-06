import type { NextRequest } from "next/server";
import { getWhop, productIdToTier } from "@/lib/whop";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkSubscriptionToSchool } from "@/lib/subscription";

// Webhook verification uses Node crypto via the SDK — force the Node runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<Response> {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event;
  try {
    event = getWhop().webhooks.unwrap(body, { headers });
  } catch {
    // Bad/missing signature — reject so Whop surfaces a delivery failure.
    return new Response("Invalid signature", { status: 401 });
  }

  // Acknowledge fast; fulfilment errors are logged, not surfaced, so Whop's
  // retry storm doesn't reprocess. Upserts keep handlers idempotent on retry.
  try {
    await handleEvent(event);
  } catch (err) {
    console.error("[whop-webhook] handler error:", err);
  }

  return new Response("OK", { status: 200 });
}

type WhopEvent = ReturnType<
  ReturnType<typeof getWhop>["webhooks"]["unwrap"]
>;

async function handleEvent(event: WhopEvent): Promise<void> {
  switch (event.type) {
    // This company-scoped webhook delivers payment.* events (membership.*
    // events are app-scoped and unavailable). payment.succeeded fires on the
    // first charge AND every renewal — the Payment payload carries the
    // customer email, product, and membership, so it's our provisioning hook.
    case "payment.succeeded": {
      const p = event.data;
      const email = p.user?.email;
      const productId = p.product?.id;
      const membershipId = p.membership?.id;

      if (!email || !productId || !membershipId) {
        console.warn("[whop-webhook] payment.succeeded missing fields", {
          hasEmail: !!email,
          productId,
          membershipId,
        });
        return;
      }

      const tier = productIdToTier(productId);
      if (!tier) {
        console.warn("[whop-webhook] unmapped product id:", productId);
        return;
      }

      const admin = createAdminClient();
      await admin.from("whop_subscriptions").upsert(
        {
          email: email.toLowerCase(),
          membership_id: membershipId,
          product_id: productId,
          tier,
          status: "active",
        },
        { onConflict: "membership_id" },
      );

      // Link to a SchoolPurse school if a user with this email already exists.
      // Otherwise onboarding links it when they sign up (either order works).
      await linkSubscriptionToSchool(email);
      break;
    }

    case "payment.failed": {
      const membershipId = event.data.membership?.id;
      if (!membershipId) return;
      const admin = createAdminClient();
      await admin
        .from("whop_subscriptions")
        .update({ status: "past_due" })
        .eq("membership_id", membershipId);
      break;
    }

    default:
      // payment.pending and any other subscribed events are ignored for now.
      break;
  }
}
