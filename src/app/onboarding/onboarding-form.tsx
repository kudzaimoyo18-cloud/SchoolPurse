"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS, LEVEL_LABEL, LEVEL_BLURB, type Level } from "@/lib/levels";
import { provisionMySchool, type OnboardingState } from "./actions";

// Onboarding uses an explicit light palette (not the theme tokens) so it always
// renders as the clean light-SaaS flow, regardless of the app's dark default.

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60";
const labelCls = "block text-[13px] font-medium text-slate-700";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function prefixOf(name: string): string {
  const letters = name
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("");
  if (letters.length >= 2 && letters.length <= 6) return letters;
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "SP";
}

const STEPS = ["School", "Details", "You", "Plan"] as const;

type Plan = "free" | "pro" | "ai";
const PLANS: Array<{ id: Plan; name: string; price: string; blurb: string }> = [
  { id: "free", name: "Starter", price: "$35/mo", blurb: "Up to 50 students, receipts & arrears." },
  { id: "pro", name: "Pro", price: "$50/mo", blurb: "Up to 250 students, staff logins, P&L." },
  { id: "ai", name: "AI", price: "Custom", blurb: "Unlimited + AI assistant & WhatsApp, priced by your numbers." },
];

export function OnboardingForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    provisionMySchool,
    null,
  );

  const [step, setStep] = React.useState(0);
  const [schoolName, setSchoolName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [prefix, setPrefix] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [prefixTouched, setPrefixTouched] = React.useState(false);
  const [levels, setLevels] = React.useState<Set<Level>>(new Set());
  const [plan, setPlan] = React.useState<Plan>("free");
  const [logoName, setLogoName] = React.useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  function handleSchoolNameChange(value: string) {
    setSchoolName(value);
    if (!slugTouched) setSlug(slugify(value));
    if (!prefixTouched) setPrefix(prefixOf(value));
  }

  function toggleLevel(l: Level) {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  const canLeaveStep0 = schoolName.trim().length >= 2 && levels.size >= 1;
  const canLeaveStep1 =
    /^[a-z0-9-]+$/.test(slug) && /^[A-Z0-9]{2,8}$/.test(prefix);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const isLast = step === STEPS.length - 1;

  return (
    <form
      action={action}
      encType="multipart/form-data"
      onSubmit={(e) => {
        if (!isLast) e.preventDefault();
      }}
      className="space-y-7"
    >
      {/* Hidden inputs so the controlled chip/plan/logo state submits. */}
      {[...levels].map((l) => (
        <input key={l} type="hidden" name="levels" value={l} />
      ))}
      <input type="hidden" name="plan" value={plan} />

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition",
                  i < step && "bg-slate-900 text-white",
                  i === step && "bg-slate-900 text-white ring-4 ring-slate-900/10",
                  i > step && "border border-slate-200 text-slate-400",
                )}
              >
                {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "mx-2 h-px flex-1 transition",
                    i < step ? "bg-slate-900" : "bg-slate-200",
                  )}
                />
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>

      {/* Step 1 — name + levels */}
      <div hidden={step !== 0} className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            What&apos;s your school called?
          </h2>
          <p className="text-[13px] text-slate-500">
            We&apos;ll print it on receipts and invoices. You can change it later.
          </p>
          <div className="space-y-1.5 pt-1">
            <label htmlFor="school_name" className={labelCls}>
              School name
            </label>
            <input
              id="school_name"
              name="school_name"
              value={schoolName}
              onChange={(e) => handleSchoolNameChange(e.target.value)}
              placeholder="e.g. Twinkle Star Junior School"
              disabled={pending}
              autoComplete="organization"
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelCls}>Which levels does it run?</label>
          <p className="text-[12px] text-slate-500">
            We&apos;ll set up the matching classes for you.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {LEVELS.map((l) => {
              const on = levels.has(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLevel(l)}
                  disabled={pending}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border p-3 text-left transition",
                    on
                      ? "border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900/10"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-md border transition",
                      on
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300",
                    )}
                  >
                    {on ? <Check className="size-3" strokeWidth={3} /> : null}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-slate-900">
                      {LEVEL_LABEL[l]}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {LEVEL_BLURB[l]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 2 — details */}
      <div hidden={step !== 1} className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          A few details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="school_slug" className={labelCls}>
              URL slug
            </label>
            <input
              id="school_slug"
              name="school_slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="twinkle-star"
              pattern="[a-z0-9-]+"
              disabled={pending}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="receipt_prefix" className={labelCls}>
              Receipt prefix
            </label>
            <input
              id="receipt_prefix"
              name="receipt_prefix"
              value={prefix}
              onChange={(e) => {
                setPrefix(e.target.value.toUpperCase());
                setPrefixTouched(true);
              }}
              maxLength={8}
              placeholder="TSJS"
              disabled={pending}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="currency" className={labelCls}>
              Currency
            </label>
            <input
              id="currency"
              name="currency"
              maxLength={4}
              defaultValue="USD"
              disabled={pending}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="terms_per_year" className={labelCls}>
              Terms / year
            </label>
            <input
              id="terms_per_year"
              name="terms_per_year"
              type="number"
              min={1}
              max={6}
              defaultValue={3}
              disabled={pending}
              className={inputCls}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="address" className={labelCls}>
            Address (optional)
          </label>
          <input
            id="address"
            name="address"
            placeholder="Street, city, country"
            disabled={pending}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="phone" className={labelCls}>
              School phone (on receipts &amp; reminders)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+263 …"
              disabled={pending}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Logo (optional)</label>
            <label
              className={cn(
                "flex h-[42px] cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500 transition hover:border-slate-400",
                pending && "opacity-60",
              )}
            >
              <ImagePlus className="size-4 shrink-0 text-slate-400" />
              <span className="truncate">
                {logoName ?? "Upload a logo (PNG/JPG)"}
              </span>
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                disabled={pending}
                className="hidden"
                onChange={(e) =>
                  setLogoName(e.target.files?.[0]?.name ?? null)
                }
              />
            </label>
          </div>
        </div>
      </div>

      {/* Step 3 — your profile */}
      <div hidden={step !== 2} className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          A bit about you
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="admin_name" className={labelCls}>
              Your name
            </label>
            <input
              id="admin_name"
              name="admin_name"
              defaultValue={defaultName}
              placeholder="Printed on receipts"
              disabled={pending}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin_phone" className={labelCls}>
              Your phone (optional)
            </label>
            <input
              id="admin_phone"
              name="admin_phone"
              type="tel"
              placeholder="+263 …"
              disabled={pending}
              className={inputCls}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Email</label>
          <input
            value={defaultEmail}
            disabled
            readOnly
            className={cn(inputCls, "bg-slate-50 text-slate-400")}
          />
        </div>
        <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            name="seed_defaults"
            defaultChecked
            disabled={pending}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-slate-900">
              Auto-create starter classes, subjects &amp; expense categories
            </span>
            <span className="block text-[11.5px] text-slate-500">
              Classes for your levels + a common starter set, so you can enrol
              right away. Uncheck for a blank slate.
            </span>
          </span>
        </label>
      </div>

      {/* Step 4 — plan */}
      <div hidden={step !== 3} className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Pick a plan
        </h2>
        <p className="text-[13px] text-slate-500">
          AI is priced by your student numbers — we&apos;ll reach out after you
          sign up. Change plans any time.
        </p>
        <div className="space-y-2.5">
          {PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                disabled={pending}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition",
                  on
                    ? "border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900/10"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition",
                    on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300",
                  )}
                >
                  {on ? <Check className="size-2.5" strokeWidth={3} /> : null}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
                    {p.name}
                    {p.id === "ai" ? (
                      <Sparkles className="size-3.5 text-amber-500" />
                    ) : null}
                  </span>
                  <span className="block text-[12px] text-slate-500">
                    {p.blurb}
                  </span>
                </span>
                <span className="text-[15px] font-bold tabular-nums text-slate-900">
                  {p.price}
                </span>
              </button>
            );
          })}
        </div>
        {plan === "ai" ? (
          <p className="text-[12px] text-slate-500">
            We&apos;ll create your school and get in touch about AI pricing for
            your student numbers.
          </p>
        ) : (
          <p className="text-[12px] text-slate-500">
            We&apos;ll create your school, then take you to secure checkout to
            activate {plan === "pro" ? "Pro" : "Starter"}.
          </p>
        )}

        <label className="flex items-start gap-2.5 pt-1 text-[12.5px] leading-relaxed text-slate-600">
          <input
            type="checkbox"
            name="accept_terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={pending}
            className="mt-0.5"
          />
          <span>
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              className="font-medium text-slate-900 underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              className="font-medium text-slate-900 underline"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      {/* Nav */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        ) : (
          <span />
        )}

        {!isLast ? (
          <button
            type="button"
            onClick={next}
            disabled={
              (step === 0 && !canLeaveStep0) || (step === 1 && !canLeaveStep1)
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            Next
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending || !acceptedTerms}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Setting up…
              </>
            ) : plan === "ai" ? (
              "Create my school"
            ) : (
              "Create & continue to payment"
            )}
          </button>
        )}
      </div>
    </form>
  );
}
