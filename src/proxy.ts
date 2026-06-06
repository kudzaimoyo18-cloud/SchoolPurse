import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that do NOT require authentication.
// `/` is the public marketing landing page.
// `/welcome` is the post-checkout magic-link signup (buyer is not authed yet).
// `/onboarding` requires auth but NOT a public.users profile — the page
// itself checks both and renders the school-creation form for new signups.
// `/api/webhooks` must be public — external services (Whop) POST here with no
// Supabase session. The route verifies its own signature, so auth gating would
// only break delivery (the middleware would 307 the POST to /login).
const PUBLIC_PATH_PREFIXES = ["/login", "/auth", "/api/webhooks"];
const PUBLIC_EXACT_PATHS = new Set(["/", "/welcome"]);

function isPublic(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Unauthenticated users hitting a protected route → /login
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.delete("error");
    return NextResponse.redirect(url);
  }

  // Authed users hitting /login → /overview (the dashboard layout will
  // route them onward to /onboarding if they don't have a profile yet).
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/app/overview";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
