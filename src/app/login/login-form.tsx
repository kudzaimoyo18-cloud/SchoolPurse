"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signIn, signInWithGoogle, type LoginState } from "./actions";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GoogleIcon className="size-4" />
      )}
      Continue with Google
    </Button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    signIn,
    null,
  );

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          or sign in with email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="bursar@school.example"
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>

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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
}
