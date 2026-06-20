import "server-only";
import { Whop } from "@whop/sdk";

/**
 * Subscription tiers offered in SchoolPurse. These MUST match the freemium
 * vocabulary in lib/plan.ts and the `schools.plan` column — every feature gate
 * reads that. "free" is the implicit tier for any school without a paid Whop
 * checkout. (Earlier starter/standard/plus naming was retired so a Whop payment
 * actually unlocks Pro/AI features.)
 */
export type SubscriptionTier = "free" | "pro" | "ai";
export type PaidTier = "pro" | "ai";

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
  const pro = process.env.WHOP_PRO_PRODUCT_ID;
  const ai = process.env.WHOP_AI_PRODUCT_ID;
  if (pro) map[pro] = "pro";
  if (ai) map[ai] = "ai";
  return map[productId];
}