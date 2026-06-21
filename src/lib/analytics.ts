import posthog from "posthog-js";

// Thin wrapper around PostHog so call sites stay tidy and everything no-ops
// safely when analytics isn't configured (no key) or hasn't loaded yet.

function ready(): boolean {
  return typeof window !== "undefined" && posthog.__loaded === true;
}

/** Record a product event (e.g. "payment_recorded", "assistant_query"). */
export function track(event: string, props?: Record<string, unknown>): void {
  if (ready()) posthog.capture(event, props);
}

/** Tie subsequent events to a known user (who signed up). */
export function identifyUser(
  id: string,
  props: Record<string, unknown>,
): void {
  if (ready()) posthog.identify(id, props);
}
