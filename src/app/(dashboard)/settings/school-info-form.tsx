"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateSchoolInfo } from "./actions";

interface School {
  name: string;
  address: string | null;
  phone: string | null;
  currency: string;
  receipt_prefix: string;
  terms_per_year: number;
}

export function SchoolInfoForm({ school }: { school: School }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await updateSchoolInfo(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("School information saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">School name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={school.name}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={school.address ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={school.phone ?? ""}
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
            defaultValue={school.currency}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="receipt_prefix">Receipt prefix</Label>
          <Input
            id="receipt_prefix"
            name="receipt_prefix"
            required
            maxLength={8}
            defaultValue={school.receipt_prefix}
            disabled={pending}
          />
          <p className="text-[11px] text-muted-foreground">
            E.g. <code>SP</code> → SP-2026-0001
          </p>
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
            defaultValue={school.terms_per_year}
            disabled={pending}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save changes
        </Button>
      </div>
    </form>
  );
}
