import type { NextConfig } from "next";

// Content-Security-Policy shipped in Report-Only mode: it never blocks a
// request, so it can't break the live app, but violations show in the browser
// console / report so the policy can be tuned and later promoted to an
// enforcing `Content-Security-Policy`. Sources cover the app's real deps:
//   - Supabase (REST + Realtime websocket + signed storage URLs)
//   - PostHog analytics
//   - the Jitsi Meet video iframe (frame-src)
// 'unsafe-inline'/'unsafe-eval' remain for now (Next's bootstrap + PostHog);
// the proper hardening is nonce-based script-src, tracked as a follow-up.
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://*.i.posthog.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.i.posthog.com",
  "frame-src 'self' https://meet.jit.si",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

// Applied to every response. These are the unambiguous, low-risk hardening
// headers. Permissions-Policy explicitly preserves camera/microphone/
// display-capture for the Jitsi classroom iframe (meet.jit.si) while denying
// powerful features the app never uses.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: [
      'camera=(self "https://meet.jit.si")',
      'microphone=(self "https://meet.jit.si")',
      'display-capture=(self "https://meet.jit.si")',
      "geolocation=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bump the default 1 MB cap so the school logo (≤2 MB) and student
      // photos (≤4 MB) can be uploaded via server actions. Vercel's platform
      // limit on serverless function bodies is 4.5 MB, so 4 MB stays safely
      // under that ceiling while matching the photo-actions max.
      bodySizeLimit: "4mb",
    },
    // Keep recently-visited pages warm in the client-side Router Cache so
    // back/forward and re-visits within the window are instant instead of
    // re-fetching the RSC payload. Dynamic defaults to 0 in Next, which makes
    // every dashboard hop a fresh server round-trip. Mutations go through
    // server actions with revalidation, so a 30s dynamic window is a safe
    // freshness/snappiness trade-off for a finance dashboard.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
