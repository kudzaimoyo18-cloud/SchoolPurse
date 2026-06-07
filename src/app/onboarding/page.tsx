import { redirect } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { OnboardingForm } from "./onboarding-form";
import { SubscriptionPending } from "./subscription-pending";

export const metadata = { title: "Set up your school — SchoolPurse" };

const VALUE_PROPS = [
  "Track every fee and payment",
  "Issue printable receipts & invoices",
  "Surface arrears at a glance",
  "Watch monthly income vs expenses",
];

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Already have a school → into the app.
  const admin = createAdminClient();
  const [byId, byEmail] = await Promise.all([
    admin.from("users").select("id").eq("id", user.id).maybeSingle(),
    user.email
      ? admin.from("users").select("id").eq("email", user.email).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (byId.data || byEmail.data) {
    redirect("/app/overview");
  }

  // Pay-first gate: require an active subscription for this email.
  const { data: activeSub } = await admin
    .from("whop_subscriptions")
    .select("id")
    .eq("email", (user.email ?? "").toLowerCase())
    .eq("status", "active")
    .maybeSingle();

  if (!activeSub) {
    return <SubscriptionPending email={user.email ?? ""} />;
  }

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (user.email?.split("@")[0] ?? "");

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Top bar — signals you're signed in (distinct from the marketing site). */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="SchoolPurse"
            width={28}
            height={28}
            className="size-7 rounded-lg object-contain"
          />
          <span className="text-[15px] font-bold tracking-tight">
            School<span className="text-primary">Purse</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            Signed in as{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </span>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="font-medium text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Split: branded aurora panel + app-surface wizard. */}
      <div className="grid flex-1 lg:grid-cols-2">
        {/* Left — branded panel (keeps the aurora, but only here). */}
        <AuroraBackground className="hidden min-h-0 px-10 py-12 lg:flex">
          <div className="w-full max-w-md space-y-7">
            <Image
              src="/logo.png"
              alt="SchoolPurse"
              width={56}
              height={56}
              className="size-14 rounded-2xl object-contain shadow-lg shadow-primary/15"
            />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Let&apos;s set up your school
              </h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                A couple of minutes to get SchoolPurse ready for fees, payments,
                receipts and arrears.
              </p>
            </div>
            <ul className="space-y-3">
              {VALUE_PROPS.map((v) => (
                <li key={v} className="flex items-center gap-2.5 text-sm">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </AuroraBackground>

        {/* Right — the wizard on a plain app surface. */}
        <div className="flex items-center justify-center bg-background px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <h1 className="text-xl font-bold tracking-tight">
                Set up your school
              </h1>
              <p className="text-sm text-muted-foreground">
                Takes about two minutes.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
              <OnboardingForm
                defaultName={defaultName}
                defaultEmail={user.email ?? ""}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
