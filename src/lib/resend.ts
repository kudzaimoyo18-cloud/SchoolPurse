import "server-only";
import { Resend } from "resend";

/**
 * Singleton Resend client for transactional email.
 *
 * Set RESEND_API_KEY in your environment (Vercel + .env.local).
 * If missing, email-sending functions gracefully no-op so the app
 * still works without email configured.
 */
let _resend: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

/**
 * The "from" address for all SchoolPurse emails.
 * Uses Resend's free onboarding domain until you verify your own.
 * Switch to "updates@yourdomain.com" once DNS is set up.
 */
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "SchoolPurse <onboarding@resend.dev>";
