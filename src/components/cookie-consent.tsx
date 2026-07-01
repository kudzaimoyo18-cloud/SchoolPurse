"use client";

import * as React from "react";

// Analytics-consent banner. Shows only when analytics is configured AND the
// visitor hasn't decided yet. The choice is stored in the `sp_analytics_consent`
// cookie; PostHogProvider reads it and only initialises when consent is
// "granted". Declining is fully respected — the app works either way.
const COOKIE = "sp_analytics_consent";
const ANALYTICS_ENABLED = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

function readConsent(): "granted" | "denied" | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sp_analytics_consent=([^;]+)/);
  return m ? ((m[1] as "granted" | "denied") ?? null) : null;
}

export function CookieConsent() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (ANALYTICS_ENABLED && readConsent() === null) setShow(true);
  }, []);

  if (!show) return null;

  function decide(value: "granted" | "denied") {
    document.cookie = `${COOKIE}=${value}; path=/; max-age=15552000; samesite=lax`;
    window.dispatchEvent(new Event("sp-consent-changed"));
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          We use a necessary cookie to keep you signed in, and optional analytics
          to improve SchoolPurse. See our{" "}
          <a href="/privacy" className="text-primary underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-foreground transition hover:bg-secondary"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
