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
// `/room` is the public student guest-join page for online classrooms — the
// slug in the URL is the access capability; no login required.
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/auth",
  "/api/webhooks",
  "/guides",
  "/room",
];
const PUBLIC_EXACT_PATHS = new Set(["/", "/welcome", "/faq"]);

function isPublic(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

// Optional subdomain split: the dashboard (/app/*) lives on this host, the
// landing on the apex. Both are UNSET by default, so behaviour is unchanged
// until the env vars + DNS are in place.
//   NEXT_PUBLIC_DASHBOARD_HOST — e.g. "app.schoolpurse.app"
//   AUTH_COOKIE_DOMAIN         — e.g. ".schoolpurse.app" (so the login cookie
//                                spans the apex and the subdomain)
const DASHBOARD_HOST = process.env.NEXT_PUBLIC_DASHBOARD_HOST;
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;
  const onDashboardHost = !!DASHBOARD_HOST && host === DASHBOARD_HOST;

  // Host-based routing (only when a dashboard host is configured).
  if (DASHBOARD_HOST) {
    // Apex requesting a dashboard path → send it to the dashboard host.
    if (
      !onDashboardHost &&
      (pathname === "/app" || pathname.startsWith("/app/"))
    ) {
      const url = new URL(request.url);
      url.protocol = "https:";
      url.host = DASHBOARD_HOST;
      return NextResponse.redirect(url);
    }
    // Dashboard host root → the dashboard home.
    if (onDashboardHost && pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/app/overview";
      return NextResponse.redirect(url);
    }
  }

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
            response.cookies.set(name, value, {
              ...options,
              ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
            }),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated users hitting a protected route → /login
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.delete("error");
    return NextResponse.redirect(url);
  }

  // Authed users hitting /login → the dashboard (on its own host if split).
  if (user && pathname === "/login") {
    if (DASHBOARD_HOST && !onDashboardHost) {
      return NextResponse.redirect(
        new URL("/app/overview", `https://${DASHBOARD_HOST}`),
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/app/overview";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Exclude Next internals, image assets, the PWA files (manifest, service
    // worker, offline fallback) and the SEO/metadata routes (robots, sitemap,
    // OG image). All of these must be publicly fetchable — if the proxy 307s
    // them to /login, the browser can't read the manifest / register the SW,
    // and crawlers + social scrapers can't read robots.txt, the sitemap, or the
    // Open Graph image.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline|manifest.webmanifest|robots.txt|sitemap.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
