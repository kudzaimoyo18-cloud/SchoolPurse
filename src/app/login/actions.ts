"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string } | null;

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Don't leak whether the email exists, the password is wrong, the user
    // is locked, etc. — all of those look identical to a casual attacker.
    // Log the real error server-side for our own diagnostics.
    console.error("[signIn] auth error:", error.message);
    return { error: "Invalid email or password." };
  }

  redirect("/overview");
}

/**
 * Kick off Google OAuth. Redirects the browser to Google's consent screen.
 * After consent Google → Supabase → our /auth/callback → /overview.
 *
 * For this to work the user must be pre-invited:
 *   1. An auth.users row exists with their email (Supabase dashboard → Auth → Users)
 *   2. A public.users row links to that auth user with a school
 *
 * If a brand-new Google account signs in, Supabase will either reject
 * (when "Allow new users" is disabled in Auth settings) or create a stray
 * auth.users row which won't have a public.users mapping and so will hit
 * /login?error=no_profile.
 */
export async function signInWithGoogle(): Promise<void> {
  const origin = await siteOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/overview`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }

  redirect(data.url);
}
