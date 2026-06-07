"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { provisionMySchool, type OnboardingState } from "./actions";

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

const STEPS = ["Your school", "Details", "Your profile"] as const;

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

  function handleSchoolNameChange(value: string) {
    setSchoolName(value);
    if (!slugTouched) setSlug(slugify(value));
    if (!prefixTouched) setPrefix(prefixOf(value));
  }

  const canLeaveStep0 = schoolName.trim().length >= 2;
  const canLeaveStep1 =
    /^[a-z0-9-]+$/.test(slug) && /^[A-Z0-9]{2,8}$/.test(prefix);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <form action={action} className="space-y-7">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition",
                  i < step && "bg-primary text-primary-foreground",
                  i === step && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  i > step && "border border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "mx-2 h-px flex-1 transition",
                    i < step ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>

      {/* Step 1 — school name */}
      <div hidden={step !== 0} className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">
          What&apos;s your school called?
        </h2>
        <p className="text-[13px] text-muted-foreground">
          We&apos;ll use this on receipts and invoices. You can change it later.
        </p>
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="school_name">School name</Label>
          <Input
            id="school_name"
            name="school_name"
            value={schoolName}
            onChange={(e) => handleSchoolNameChange(e.target.value)}
            placeholder="e.g. Twinkle Star Junior School"
            disabled={pending}
            autoComplete="organization"
          />
        </div>
      </div>

      {/* Step 2 — details */}
      <div hidden={step !== 1} className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">A few details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="school_slug">URL slug</Label>
            <Input
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
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receipt_prefix">Receipt prefix</Label>
            <Input
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
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" maxLength={4} defaultValue="USD" disabled={pending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="terms_per_year">Terms / year</Label>
            <Input id="terms_per_year" name="terms_per_year" type="number" min={1} max={6} defaultValue={3} disabled={pending} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" name="address" placeholder="Street, city, country" disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">School phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+263 …" disabled={pending} />
        </div>
      </div>

      {/* Step 3 — your profile */}
      <div hidden={step !== 2} className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">A bit about you</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="admin_name">Your name</Label>
            <Input id="admin_name" name="admin_name" defaultValue={defaultName} placeholder="Printed on receipts" disabled={pending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin_phone">Your phone (optional)</Label>
            <Input id="admin_phone" name="admin_phone" type="tel" placeholder="+263 …" disabled={pending} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={defaultEmail} disabled readOnly className="bg-sp-card-alt text-muted-foreground" />
        </div>
        <label className="flex items-start gap-2.5 rounded-md border border-border bg-sp-card-alt px-3 py-2.5 text-sm">
          <input type="checkbox" name="seed_defaults" defaultChecked disabled={pending} className="mt-0.5" />
          <span>
            <span className="font-medium">Start with common subjects &amp; expense categories</span>
            <span className="block text-[11.5px] text-muted-foreground">
              A starter set of subjects and expense categories. Uncheck for a completely blank slate.
            </span>
          </span>
        </label>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {/* Nav */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={back} disabled={pending} className="gap-1.5">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : (
          <span />
        )}

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={next}
            disabled={(step === 0 && !canLeaveStep0) || (step === 1 && !canLeaveStep1)}
            className="gap-1.5"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={pending} className="gap-1.5">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Setting up your school…
              </>
            ) : (
              "Create my school"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
