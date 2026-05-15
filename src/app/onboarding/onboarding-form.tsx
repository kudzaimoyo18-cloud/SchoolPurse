"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  // Fallback to first 4 alphanum chars
  return (
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4) || "SP"
  );
}

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

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="school_name">School name</Label>
        <Input
          id="school_name"
          name="school_name"
          required
          value={schoolName}
          onChange={(e) => handleSchoolNameChange(e.target.value)}
          placeholder="e.g. Twinkle Star Junior School"
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="school_slug">URL slug</Label>
          <Input
            id="school_slug"
            name="school_slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="twinkle-star"
            pattern="[a-z0-9-]+"
            disabled={pending}
          />
          <p className="text-[11px] text-muted-foreground">
            Lowercase letters, numbers, hyphens. Must be unique.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="receipt_prefix">Receipt prefix</Label>
          <Input
            id="receipt_prefix"
            name="receipt_prefix"
            required
            value={prefix}
            onChange={(e) => {
              setPrefix(e.target.value.toUpperCase());
              setPrefixTouched(true);
            }}
            maxLength={8}
            placeholder="TSJS"
            disabled={pending}
          />
          <p className="text-[11px] text-muted-foreground">
            e.g. TSJS → <span className="font-mono">TSJS-2026-000001</span>
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address (optional)</Label>
        <Input
          id="address"
          name="address"
          placeholder="Street, city, country"
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">School phone (optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+263 …"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            required
            maxLength={4}
            defaultValue="USD"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="terms_per_year">Terms per year</Label>
          <Input
            id="terms_per_year"
            name="terms_per_year"
            type="number"
            min={1}
            max={6}
            required
            defaultValue={3}
            disabled={pending}
          />
        </div>
      </div>

      <hr className="border-border" />

      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        Your account
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="admin_name">Your name</Label>
          <Input
            id="admin_name"
            name="admin_name"
            required
            defaultValue={defaultName}
            placeholder="As you'd like it printed on receipts"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin_email">Email</Label>
          <Input
            id="admin_email"
            value={defaultEmail}
            disabled
            readOnly
            className="bg-sp-card-alt text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin_phone">Your phone (optional)</Label>
        <Input
          id="admin_phone"
          name="admin_phone"
          type="tel"
          placeholder="+263 …"
          disabled={pending}
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-md border border-border bg-sp-card-alt px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          name="seed_defaults"
          defaultChecked
          disabled={pending}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium">Start with default classes and fee items</span>
          <span className="block text-[11.5px] text-muted-foreground">
            We&apos;ll create ECD A/B, GRADE 1–7, default fee items, the
            current academic year and current term. You can edit anything
            after onboarding. Uncheck if you prefer a blank slate.
          </span>
        </span>
      </label>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Setting up your school…
          </>
        ) : (
          "Create my school"
        )}
      </Button>
    </form>
  );
}
