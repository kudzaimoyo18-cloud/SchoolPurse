import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in — SchoolPurse",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app/overview");
  }

  const { error } = await searchParams;

  return (
    <AuroraBackground className="flex-1 px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary p-3.5 text-primary-foreground shadow-lg shadow-primary/15">
            <Briefcase className="size-7" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            School<span className="text-primary">Purse</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your school&apos;s finances
          </p>
        </div>

        {/* Error message */}
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error === "missing_code" || error === "oauth_failed"
              ? "Sign-in didn't complete. Please try again."
              : error}
          </p>
        ) : null}

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-card/95 p-7 shadow-xl shadow-primary/[0.04] backdrop-blur-md">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          New here? Sign in with Google &mdash; we&apos;ll help you set up your
          school right after.
        </p>
      </div>
    </AuroraBackground>
  );
}
