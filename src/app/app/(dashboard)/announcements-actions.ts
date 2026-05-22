"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM } from "@/lib/resend";

/* ------------------------------------------------------------------ */
/*  Dismiss — any authenticated user                                   */
/* ------------------------------------------------------------------ */

export async function dismissAnnouncement(announcementId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  await supabase.from("announcement_dismissals").upsert(
    { user_id: user.id, announcement_id: announcementId },
    { onConflict: "user_id,announcement_id" },
  );

  revalidatePath("/app");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Create + email — platform_admin only                               */
/* ------------------------------------------------------------------ */

export type CreateAnnouncementResult =
  | { ok: true; id: string; emailsSent: number }
  | { ok: false; error: string };

export async function createAnnouncement(formData: FormData): Promise<CreateAnnouncementResult> {
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const type = (formData.get("type") as string) || "info";
  const sendEmail = formData.get("send_email") === "on";

  if (!title) return { ok: false, error: "Title is required" };

  // Verify caller is platform_admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "platform_admin") {
    return { ok: false, error: "Only platform admins can create announcements" };
  }

  // Insert announcement
  const { data: row, error: insertErr } = await admin
    .from("announcements")
    .insert({ title, body: body || "", type, active: true, email_sent: false })
    .select("id")
    .single();

  if (insertErr || !row) {
    return { ok: false, error: insertErr?.message ?? "Failed to create announcement" };
  }
  const announcementId = (row as { id: string }).id;

  // Optionally send email to all active users
  let emailsSent = 0;
  if (sendEmail) {
    const resend = getResend();
    if (resend) {
      // Fetch all active user emails
      const { data: users } = await admin
        .from("users")
        .select("email, name")
        .eq("status", "active");

      const recipients = (users ?? []) as { email: string; name: string }[];

      if (recipients.length > 0) {
        // Send in batches of 50 (Resend batch limit is 100)
        const batchSize = 50;
        for (let i = 0; i < recipients.length; i += batchSize) {
          const batch = recipients.slice(i, i + batchSize);
          try {
            await resend.batch.send(
              batch.map((r) => ({
                from: EMAIL_FROM,
                to: r.email,
                subject: `SchoolPurse: ${title}`,
                html: buildEmailHtml(title, body || "", type, r.name),
              })),
            );
            emailsSent += batch.length;
          } catch (err) {
            console.error("Resend batch error:", err);
          }
        }
      }

      // Mark email as sent
      await admin
        .from("announcements")
        .update({ email_sent: true })
        .eq("id", announcementId);
    }
  }

  revalidatePath("/app");
  return { ok: true, id: announcementId, emailsSent };
}

/* ------------------------------------------------------------------ */
/*  Deactivate an announcement — platform_admin only                   */
/* ------------------------------------------------------------------ */

export async function deactivateAnnouncement(announcementId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "platform_admin") {
    return { ok: false, error: "Only platform admins can manage announcements" };
  }

  await admin
    .from("announcements")
    .update({ active: false })
    .eq("id", announcementId);

  revalidatePath("/app");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  HTML email template                                                */
/* ------------------------------------------------------------------ */

function buildEmailHtml(
  title: string,
  body: string,
  type: string,
  recipientName: string,
): string {
  const typeColor: Record<string, string> = {
    info: "#3b82f6",
    warning: "#f59e0b",
    success: "#16a34a",
    update: "#8b5cf6",
  };
  const color = typeColor[type] ?? typeColor.info;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="padding:24px 28px;border-bottom:3px solid ${color};">
      <img src="https://schoolpurse.vercel.app/logo.png" alt="SchoolPurse" width="140" style="margin-bottom:16px;"/>
      <h1 style="margin:0;font-size:20px;color:#18181b;">${escapeHtml(title)}</h1>
    </div>
    <div style="padding:24px 28px;font-size:15px;line-height:1.6;color:#3f3f46;">
      <p style="margin:0 0 12px;">Hi ${escapeHtml(recipientName)},</p>
      ${body ? `<p style="margin:0 0 16px;">${escapeHtml(body).replace(/\n/g, "<br/>")}</p>` : ""}
      <p style="margin:16px 0 0;color:#71717a;font-size:13px;">
        — The SchoolPurse Team
      </p>
    </div>
    <div style="padding:16px 28px;background:#fafafa;font-size:11px;color:#a1a1aa;text-align:center;">
      You're receiving this because you're a SchoolPurse user.
    </div>
  </div>
</body>
</html>`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
