import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { Button } from "@/components/ui/button";

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

  const { error } = await searchParams;

  // If the user is authed AND we're not handling a no_profile error, bounce.
  if (user && error !== "no_profile") {
    redirect("/overview");
  }

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
            Sign in to your school&apos;s admin board
          </p>
        </div>

        {error === "no_profile" && user ? (
          <div className="space-y-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Account not linked to a school</p>
            <p>
              You signed in as{" "}
              <span className="font-mono text-xs">{user.email}</span> but there&apos;s
              no <code>public.users</code> row matching this auth user yet.
            </p>
            <div className="rounded bg-black/5 px-2 py-1.5 font-mono text-[11px] leading-relaxed dark:bg-white/5">
              <div>
                <span className="opacity-60">auth.users.id =</span> {user.id}
              </div>
              <div>
                <span className="opacity-60">email =</span> {user.email}
              </div>
            </div>
            <p className="text-xs">
              <strong>To fix:</strong> in the Supabase SQL editor, run:
            </p>
            <pre className="overflow-x-auto rounded bg-black/5 px-2 py-1.5 text-[11px] leading-relaxed dark:bg-white/5">{`-- If the user already exists in public.users by email, sync the id:
update public.users
   set id = '${user.id}'
 where email = '${user.email}';

-- Otherwise create the row + a school via the seed script
-- (supabase/seed.sql in the repo).`}</pre>
            <form action="/auth/logout" method="post">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full"
              >
                Sign out and try another account
              </Button>
            </form>
          </div>
        ) : error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error === "missing_code" || error === "oauth_failed"
              ? "Sign-in didn't complete. Please try again."
              : error}
          </p>
        ) : null}

        {!user ? (
          <>
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <LoginForm />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Forgot your password? Contact your school administrator.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
