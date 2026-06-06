"use client";

import { useActionState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassButton } from "@/components/ui/glass-button";
import { requestMagicLink, type WelcomeState } from "./actions";

export function WelcomeForm() {
  const [state, action, pending] = useActionState<WelcomeState, FormData>(
    requestMagicLink,
    null,
  );

  if (state && "sent" in state) {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to{" "}
          <span className="font-medium text-foreground">{state.email}</span>.
          Click it to finish setting up your school.
        </p>
        <p className="text-[12px] text-muted-foreground">
          No email after a minute? Check spam, or make sure you used the address
          you paid with.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@school.example"
          disabled={pending}
        />
        <p className="text-[12px] text-muted-foreground">
          Use the same email you paid with on Whop.
        </p>
      </div>

      {state && "error" in state ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <GlassButton
        type="submit"
        disabled={pending}
        wrapClassName="w-full"
        className="w-full"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending link…
          </>
        ) : (
          <>
            <Mail className="size-4" />
            Email me a sign-in link
          </>
        )}
      </GlassButton>
    </form>
  );
}
