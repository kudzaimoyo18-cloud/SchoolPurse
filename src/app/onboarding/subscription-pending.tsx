import Image from "next/image";
import Link from "next/link";
import { Clock, RefreshCw } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";

/**
 * Shown at /onboarding when the signed-in user has no active Whop
 * subscription recorded yet. Two real cases:
 *  1. Webhook lag — they just paid and payment.succeeded is in flight.
 *     "Refresh" re-runs the server check a moment later.
 *  2. Email mismatch — they signed in with a different address than they paid
 *     with. We point them to support.
 */
export function SubscriptionPending({ email }: { email: string }) {
  return (
    <AuroraBackground className="flex-1 px-6 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <Image
          src="/logo.png"
          alt="SchoolPurse"
          width={56}
          height={56}
          className="mx-auto size-14 rounded-2xl object-contain shadow-lg shadow-primary/15"
          priority
        />
        <div className="rounded-2xl border border-border bg-card/95 p-8 shadow-xl shadow-primary/[0.04] backdrop-blur-md">
          <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Confirming your subscription…
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re matching your payment to{" "}
            <span className="font-medium text-foreground">{email}</span>. This
            usually takes a few seconds.
          </p>

          <form action="/onboarding" method="get" className="mt-6">
            <Button type="submit" className="w-full gap-2">
              <RefreshCw className="size-4" />
              I&apos;ve paid — refresh
            </Button>
          </form>

          <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
            Just paid? Give it a moment and refresh. Used a different email at
            checkout, or haven&apos;t subscribed yet?{" "}
            <Link href="/#pricing" className="font-medium text-primary underline">
              See plans
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:support@schoolpurse.app"
              className="font-medium text-primary underline"
            >
              support@schoolpurse.app
            </a>
            .
          </p>
        </div>

        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="text-xs text-muted-foreground underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </AuroraBackground>
  );
}
