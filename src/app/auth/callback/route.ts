import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback for BOTH:
 *  - OAuth / PKCE magic links (same device): ?code=...  -> exchangeCodeForSession
 *  - Email OTP magic links (cross device):  ?token_hash=...&type=... -> verifyOtp
 *
 * Same-device magic links use PKCE (the code verifier cookie lives on the
 * device that requested the link). For cross-device delivery, customise the
 * Supabase "Magic Link" email template to point at:
 *   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/app/overview";
  const errorParam = searchParams.get("error");
  const errorDesc =
    searchParams.get("error_description") || searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc ?? "oauth_failed")}`,
    );
  }

  // Prevent open-redirect: only allow local next paths.
  const safeNext = next.startsWith("/") ? next : "/app/overview";
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
