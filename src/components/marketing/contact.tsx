"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check, Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitContact, type ContactState } from "@/app/(marketing)/actions";

export function Contact() {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    submitContact,
    null,
  );

  const success = state?.ok === true;

  return (
    <section id="contact" className="border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:py-28">
        <div>
          <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary dark:bg-primary/20">
            Contact
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Tell us about your school
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            How many students? What&apos;s your current setup? We&apos;ll come
            back within one working day, no high-pressure sales call.
          </p>

          <ul className="mt-8 space-y-5 text-[14px]">
            <li className="flex items-start gap-3.5">
              <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
                <Mail className="size-4.5" />
              </span>
              <div>
                <p className="font-semibold">Email</p>
                <a
                  href="mailto:support@schoolpurse.app"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  support@schoolpurse.app
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
                <MessageSquare className="size-4.5" />
              </span>
              <div>
                <p className="font-semibold">Response time</p>
                <p className="text-muted-foreground">
                  Within one working day, often same-day.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-primary/[0.03] sm:p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-sp-green-soft text-sp-green">
                <Check className="size-7" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">
                Message received
              </h3>
              <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
                Thanks for reaching out. We&apos;ll be in touch shortly to set
                up a conversation about your school&apos;s setup.
              </p>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              {/* Honeypot — hidden from real users, irresistible to bots */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Your name</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    required
                    autoComplete="name"
                    disabled={pending}
                    placeholder="Tendai Moyo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    disabled={pending}
                    placeholder="bursar@school.example"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-school">School name (optional)</Label>
                <Input
                  id="contact-school"
                  name="school"
                  autoComplete="organization"
                  disabled={pending}
                  placeholder="St Mary's High School"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">
                  Tell us about your school
                </Label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  disabled={pending}
                  placeholder="How many students? How are you tracking fees today?"
                  className="flex w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm shadow-sm transition placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {state && !state.ok ? (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {state.error}
                </p>
              ) : null}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending&hellip;
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Send message
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                By submitting, you agree to be contacted about SchoolPurse.
                We&apos;ll never share your details.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
