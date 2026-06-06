"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type WelcomeState =
  | { error: string }
  | { sent: true; email: string }
  | null;

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Pay-first signup entry point. We send the magic link optimistically — we do
 * NOT block on the Whop webhook here (it may land a few seconds after the
 * buyer is redirected). The paid-plan check is enforced at /onboarding, where
 * the school is actually created. This mirrors how Stripe/Paddle-backed SaaS
 * handle the checkout->app handoff: proceed, reconcile via webhook.
 */
export async function requestMagicLink(
  _prev: WelcomeState,
  formData: FormData,
): Promise<WelcomeState> {
  const parsed = Schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }
  const email = parsed.data.email;

  const origin = await siteOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    console.error("[welcome] magic link error:", error.message);
    return { error: "We couldn't send the link. Please try again." };
  }

  return { sent: true, email };
}
