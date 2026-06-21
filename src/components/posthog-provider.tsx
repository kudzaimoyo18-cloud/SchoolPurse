"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

// Product analytics (who signed up + activity). No-ops entirely when
// NEXT_PUBLIC_POSTHOG_KEY isn't set, so dev/preview without a key is fine.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (!KEY || posthog.__loaded) return;
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: false, // captured manually on route change below
      person_profiles: "identified_only",
    });
  }, []);

  React.useEffect(() => {
    if (KEY && posthog.__loaded) posthog.capture("$pageview");
  }, [pathname]);

  return <>{children}</>;
}
