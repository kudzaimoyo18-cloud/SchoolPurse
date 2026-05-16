import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up your school — SchoolPurse" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If they already have a school, send them home. Two separate queries
  // avoid interpolating user.email into PostgREST's .or() filter syntax.
  const admin = createAdminClient();
  const [byId, byEmail] = await Promise.all([
    admin.from("users").select("id").eq("id", user.id).maybeSingle(),
    user.email
      ? admin
          .from("users")
          .select("id")
          .eq("email", user.email)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (byId.data || byEmail.data) {
    redirect("/overview");
  }

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (user.email?.split("@")[0] ?? "");

  return (
    <div className="flex min-h-svh flex-col items-center bg-sp-card-alt px-6 py-10">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center rounded-xl bg-sidebar p-3 text-primary">
            <Briefcase className="size-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to School<span className="text-primary">Purse</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s set up your school. This takes about 30 seconds — you
            can change everything later in Settings.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <OnboardingForm
            defaultName={defaultName}
            defaultEmail={user.email ?? ""}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Not your account?{" "}
          <form action="/auth/logout" method="post" className="inline">
            <Button
              type="submit"
              variant="link"
              className="h-auto p-0 text-xs underline"
            >
              Sign out
            </Button>
          </form>
        </p>
      </div>
    </div>
  );
}
