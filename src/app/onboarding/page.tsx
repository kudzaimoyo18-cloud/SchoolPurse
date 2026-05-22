import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/ui/aurora-background";
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
    redirect("/app/overview");
  }

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (user.email?.split("@")[0] ?? "");

  return (
    <AuroraBackground className="px-6 py-10">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary p-3.5 text-primary-foreground shadow-lg shadow-primary/15">
            <Briefcase className="size-7" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to School<span className="text-primary">Purse</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s set up your school. This takes about 30 seconds &mdash; you
            can change everything later in Settings.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/95 p-7 shadow-xl shadow-primary/[0.04] backdrop-blur-md">
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
    </AuroraBackground>
  );
}
