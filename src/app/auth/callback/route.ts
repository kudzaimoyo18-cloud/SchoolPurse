import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler. Supabase redirects here with ?code=<auth-code>
 * after the user completes the Google consent flow. We exchange the code
 * for a session (which sets the auth cookies) and redirect to ?next.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app/overview";
  const errorParam = searchParams.get("error");
  const errorDesc =
    searchParams.get("error_description") || searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc ?? "oauth_failed")}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Ensure the next path is local (prevent open-redirect)
  const safeNext = next.startsWith("/") ? next : "/app/overview";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
