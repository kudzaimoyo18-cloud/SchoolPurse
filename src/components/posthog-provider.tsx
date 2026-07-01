"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

// Product analytics (who signed up + activity). No-ops entirely when
// NEXT_PUBLIC_POSTHOG_KEY isn't set, so dev/preview without a key is fine.
// Only initialises after the visitor grants analytics consent via the cookie
// banner (sp_analytics_consent=granted) — see components/cookie-consent.tsx.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

function analyticsConsented(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|; )sp_analytics_consent=granted(?:;|$)/.test(document.cookie);
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    function maybeInit() {
      if (!KEY || posthog.__loaded || !analyticsConsented()) return;
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false, // captured manually on route change below
        person_profiles: "identified_only",
      });
    }
    // Init now if consent was already granted, and again if the visitor
    // accepts via the cookie banner during this session.
    maybeInit();
    window.addEventListener("sp-consent-changed", maybeInit);
    return () => window.removeEventListener("sp-consent-changed", maybeInit);
  }, []);

  React.useEffect(() => {
    if (KEY && posthog.__loaded) posthog.capture("$pageview");
  }, [pathname]);

  return <>{children}</>;
}
