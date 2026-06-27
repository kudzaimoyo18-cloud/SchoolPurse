import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Crawlers may index the public marketing surface; the authed app, API routes,
// auth/account-lifecycle pages and the public room slugs are kept out of the
// index (they're either gated, transactional, or per-link capabilities).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app/",
        "/api/",
        "/auth/",
        "/login",
        "/onboarding",
        "/welcome",
        "/room/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
