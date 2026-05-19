import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center rounded-xl bg-sidebar p-3 text-primary">
            <Briefcase className="size-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            School<span className="text-primary">Purse</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your school&apos;s finances
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error === "missing_code" || error === "oauth_failed"
              ? "Sign-in didn't complete. Please try again."
              : error}
          </p>
        ) : null}

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          New here? Sign in with Google — we&apos;ll help you set up your
          school right after.
        </p>
      </div>
    </div>
  );
}
