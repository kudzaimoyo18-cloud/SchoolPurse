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
    redirect("/overview");
  }

  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center rounded-xl bg-sidebar p-3 text-primary">
            <Briefcase className="size-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            School<span className="text-primary">Purse</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your school&apos;s admin board
          </p>
        </div>

        {error === "no_profile" ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            Your account is authenticated but not linked to a school yet. Ask
            a platform admin to run the bootstrap seed.
          </p>
        ) : null}

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Forgot your password? Contact your school administrator.
        </p>
      </div>
    </div>
  );
}
