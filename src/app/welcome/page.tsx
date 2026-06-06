import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { WelcomeForm } from "./welcome-form";

export const metadata = { title: "Welcome — SchoolPurse" };

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in — skip straight to the app (which routes to /onboarding
  // if they haven't created a school yet).
  if (user) {
    redirect("/app/overview");
  }

  return (
    <AuroraBackground className="flex-1 px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3 text-center">
          <Image
            src="/logo.png"
            alt="SchoolPurse"
            width={56}
            height={56}
            className="mx-auto size-14 rounded-2xl object-contain shadow-lg shadow-primary/15"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to School<span className="text-primary">Purse</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Thanks for subscribing! Enter your email and we&apos;ll send a
            secure link to set up your school — no password needed.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/95 p-7 shadow-xl shadow-primary/[0.04] backdrop-blur-md">
          <WelcomeForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already set up?{" "}
          <Link href="/login" className="font-medium text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuroraBackground>
  );
}
