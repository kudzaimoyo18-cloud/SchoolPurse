import { Sparkles, Lock } from "lucide-react";
import { requireRole } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { normalizePlan } from "@/lib/plan";
import { AssistantChat } from "./assistant-chat";

export const metadata = { title: "Assistant — SchoolPurse" };

const FINANCE = ["platform_admin", "school_admin", "bursar"] as const;

export default async function AssistantPage() {
  const user = await requireRole(FINANCE);

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("plan")
    .limit(1)
    .maybeSingle();
  const plan = normalizePlan((school as { plan?: string } | null)?.plan);

  if (plan !== "ai") return <UpgradeGate />;

  return (
    <div className="mx-auto flex h-[calc(100svh-9rem)] w-full max-w-3xl flex-col">
      <header className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4.5" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-lg font-semibold leading-tight tracking-tight">
            Assistant
          </h1>
          <p className="text-xs text-sp-text-sub">
            Ask about your school&apos;s fees and finances in plain words.
          </p>
        </div>
      </header>
      <AssistantChat firstName={user.name.split(" ")[0]} />
    </div>
  );
}

const AI_CHECKOUT = process.env.NEXT_PUBLIC_WHOP_AI_CHECKOUT;

function UpgradeGate() {
  return (
    <div className="mx-auto w-full max-w-xl py-10">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sp-card-alt to-background p-8 text-center shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl"
        />
        <span className="relative inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-6" strokeWidth={2} />
        </span>
        <h1 className="relative mt-4 text-xl font-bold tracking-tight">
          Meet your finance assistant
        </h1>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Ask &ldquo;who owes the most?&rdquo;, &ldquo;how much did we collect
          this month?&rdquo;, or &ldquo;what does Tariro owe?&rdquo; and get an
          instant answer — no digging through screens. Part of the{" "}
          <span className="font-medium text-foreground">AI plan</span>.
        </p>
        <a
          href={AI_CHECKOUT ?? "/#pricing"}
          {...(AI_CHECKOUT ? { target: "_blank", rel: "noreferrer" } : {})}
          className="relative mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Lock className="size-4" strokeWidth={2.2} />
          Upgrade to AI
        </a>
      </div>
    </div>
  );
}
