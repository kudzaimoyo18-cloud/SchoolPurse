import "server-only";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { buildWelcomeEmailHtml, type Tier } from "@/lib/emails/welcome-template";

/**
 * Sends the "welcome to the dashboard" email after a school finishes
 * onboarding. No-ops gracefully when Resend isn't configured, and never
 * throws — a failed email must not break onboarding.
 */
export async function sendWelcomeEmail(params: {
  to: string;
  recipientName: string;
  schoolName: string;
  tier?: Tier;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Welcome to SchoolPurse, ${params.schoolName}!`,
      html: buildWelcomeEmailHtml({
        recipientName: params.recipientName,
        schoolName: params.schoolName,
        tier: params.tier,
      }),
    });
  } catch (err) {
    console.error("[email] welcome send failed:", err);
  }
}
