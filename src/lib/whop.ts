import "server-only";
import { Whop } from "@whop/sdk";

/**
 * Subscription tiers offered in SchoolPurse. "free" is the implicit tier for
 * any school that has not completed a paid Whop checkout.
 */
export type SubscriptionTier = "free" | "starter" | "standard" | "plus";
export type PaidTier = "starter" | "standard" | "plus";

/**
 * Lazily-instantiated Whop client.
 *
 * We construct on first use rather than at module load so a missing env var
 * doesn't crash `next build` / `next dev` (route modules are evaluated during
 * the build's route-collection pass even though no request is handled).
 *
 * Only `webhookKey` is required for signature verification. `apiKey` is only
 * needed if we later make outbound Whop API calls.
 */
let client: Whop | null = null;

export function getWhop(): Whop {
  if (!client) {
    client = new Whop({
      apiKey: process.env.WHOP_API_KEY ?? "",
      // Pass the RAW secret from the Whop dashboard (e.g. "whsec_...").
      // The SDK delegates to the `standardwebhooks` library, which strips the
      // "whsec_" prefix and base64-DECODES the remainder to derive the HMAC
      // key. Do NOT pre-encode it — double-encoding breaks verification.
      webhookKey: process.env.WHOP_WEBHOOK_SECRET ?? null,
    });
  }
  return client;
}

/**
 * Map a Whop product id to a SchoolPurse tier. Read from env on every call so
 * tests / runtime config changes are picked up without a stale module-load
 * snapshot.
 */
export function productIdToTier(productId: string): PaidTier | undefined {
  if (!productId) return undefined;
  const map: Record<string, PaidTier> = {};
  const starter = process.env.WHOP_STARTER_PRODUCT_ID;
  const standard = process.env.WHOP_STANDARD_PRODUCT_ID;
  const plus = process.env.WHOP_PLUS_PRODUCT_ID;
  if (starter) map[starter] = "starter";
  if (standard) map[standard] = "standard";
  if (plus) map[plus] = "plus";
  return map[productId];
}