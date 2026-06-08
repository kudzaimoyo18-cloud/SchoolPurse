"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  school: z.string().trim().max(200).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (10+ characters)")
    .max(4000),
});

export type ContactState =
  | { ok: true; submitted: true }
  | { ok: false; error: string }
  | null;

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot — if a bot filled the hidden "website" field, silently succeed.
  if (String(formData.get("website") ?? "").length > 0) {
    return { ok: true, submitted: true };
  }

  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    school: formData.get("school") || "",
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your input.",
    };
  }

  let userAgent: string | null = null;
  try {
    const h = await headers();
    userAgent = h.get("user-agent");
  } catch {
    // headers() may be unavailable in some contexts — non-fatal.
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("contact_submissions").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      school: parsed.data.school || null,
      message: parsed.data.message,
      source: "marketing_site",
      user_agent: userAgent,
    });

    if (error) {
      console.error("[contact] insert failed:", error.message);
      // If the table doesn't exist yet (migration not run), don't leak the
      // error to visitors — log it server-side and report a soft success.
      // The user can re-attempt once we've run the migration.
      if (/contact_submissions/i.test(error.message)) {
        return {
          ok: false,
          error:
            "Our contact backend isn't ready yet — please email us at support@schoolpurse.app instead.",
        };
      }
      return {
        ok: false,
        error: "Something went wrong. Please try again in a moment.",
      };
    }
  } catch (err) {
    console.error("[contact] unexpected error:", err);
    return {
      ok: false,
      error: "Something went wrong. Please try again in a moment.",
    };
  }

  return { ok: true, submitted: true };
}
