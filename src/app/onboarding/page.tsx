import { redirect } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up your school — SchoolPurse" };

const VALUE_PROPS = [
  "Fees, receipts & arrears from $35/month",
  "Everything in one place — no spreadsheets",
  "In-app messages — no more WhatsApp groups",
  "Upgrade for the AI assistant & WhatsApp reminders",
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

  // Freemium: onboarding is open — no pay-first gate. New schools start Free;
  // paid tiers hand off to Whop checkout from the wizard's last step.
  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (user.email?.split("@")[0] ?? "");

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="SchoolPurse"
            width={28}
            height={28}
            className="size-7 rounded-lg object-contain"
          />
          <span className="text-[15px] font-bold tracking-tight text-slate-900">
            School<span className="text-amber-500">Purse</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="hidden sm:inline">
            Signed in as{" "}
            <span className="font-medium text-slate-900">{user.email}</span>
          </span>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="font-medium text-slate-500 underline underline-offset-2 transition hover:text-slate-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-2">
        {/* Left — light value panel */}
        <div className="hidden min-h-0 flex-col justify-center bg-white px-10 py-12 lg:flex">
          <div className="w-full max-w-md space-y-7">
            <Image
              src="/logo.png"
              alt="SchoolPurse"
              width={52}
              height={52}
              className="size-[52px] rounded-2xl object-contain"
            />
            <div className="space-y-2.5">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900">
                Set up your school in a couple of minutes
              </h1>
              <p className="text-[15px] leading-relaxed text-slate-500">
                Fees, payments, receipts and arrears — built for schools in
                Zimbabwe and the region.
              </p>
            </div>
            <ul className="space-y-3">
              {VALUE_PROPS.map((v) => (
                <li key={v} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — wizard card */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Set up your school
              </h1>
              <p className="text-sm text-slate-500">Takes about two minutes.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
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
