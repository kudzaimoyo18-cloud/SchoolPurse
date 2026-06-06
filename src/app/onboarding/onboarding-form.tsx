"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
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
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "SP";
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
      {/* The only required, visible field — everything else has a smart
          default and lives under "Advanced setup". */}
      <div className="space-y-1.5">
        <Label htmlFor="school_name">What&apos;s your school called?</Label>
        <Input
          id="school_name"
          name="school_name"
          required
          autoFocus
          value={schoolName}
          onChange={(e) => handleSchoolNameChange(e.target.value)}
          placeholder="e.g. Twinkle Star Junior School"
          disabled={pending}
        />
        <p className="text-[11px] text-muted-foreground">
          You can change everything else later in Settings.
        </p>
      </div>

      <details className="group rounded-lg border border-border bg-sp-card-alt/40">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground">
          Advanced setup (optional)
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-5 px-3.5 pb-4 pt-1">
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
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="Street, city, country"
              disabled={pending}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">School phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+263 …" disabled={pending} />
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
              <Label htmlFor="terms_per_year">Terms / year</Label>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin_name">Your name</Label>
              <Input
                id="admin_name"
                name="admin_name"
                required
                defaultValue={defaultName}
                placeholder="Printed on receipts"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin_phone">Your phone</Label>
              <Input id="admin_phone" name="admin_phone" type="tel" placeholder="+263 …" disabled={pending} />
            </div>
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
              <span className="font-medium">Start with default classes &amp; fee items</span>
              <span className="block text-[11.5px] text-muted-foreground">
                ECD A/B, Grade 1–7, common fee items, current year &amp; term.
                Uncheck for a blank slate.
              </span>
            </span>
          </label>
        </div>
      </details>

      <input type="hidden" name="admin_email_display" value={defaultEmail} />

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
