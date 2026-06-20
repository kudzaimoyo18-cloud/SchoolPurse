"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { normalizePlan } from "@/lib/plan";
import { fetchArrears } from "@/lib/queries/arrears";
import { enqueueAndSend } from "@/lib/messaging/send";
import { formatMoney } from "@/lib/format";

const FINANCE = ["platform_admin", "school_admin", "bursar"];

export interface ReminderResult {
  ok: boolean;
  error?: string;
  sent?: number;
  skipped?: number;
  failed?: number;
  noPhone?: number;
}

/**
 * Queue a WhatsApp fee reminder to every family in arrears that has a parent
 * phone on file. AI-plan only. Delivery depends on a configured WhatsApp
 * provider — without one, messages are recorded as "skipped" (the button
 * reports them as saved, not sent).
 */
export async function sendArrearsReminders(): Promise<ReminderResult> {
  const user = await getCurrentUser();
  if (!user.schoolId) return { ok: false, error: "No school on this account." };
  if (!FINANCE.includes(user.role)) {
    return { ok: false, error: "You don't have access to this." };
  }

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name, plan, phone")
    .eq("id", user.schoolId)
    .maybeSingle();

  const plan = normalizePlan((school as { plan?: string } | null)?.plan);
  if (plan !== "ai") {
    return { ok: false, error: "WhatsApp reminders are part of the AI plan." };
  }

  const arrears = await fetchArrears();
  if (arrears.length === 0) {
    return { ok: true, sent: 0, skipped: 0, failed: 0, noPhone: 0 };
  }

  const ids = arrears.map((a) => a.student_id);
  const { data: students } = await supabase
    .from("students")
    .select("id, parent_phone")
    .in("id", ids);
  const phoneById = new Map(
    (students ?? []).map((s) => {
      const row = s as { id: string; parent_phone: string | null };
      return [row.id, row.parent_phone];
    }),
  );

  const schoolRow = school as { name?: string; phone?: string | null } | null;
  const schoolName = schoolRow?.name ?? "your school";
  // Platform-managed sending: the API sender is SchoolPurse's number, so the
  // school's identity (name + receipt phone) goes IN the message so parents see
  // who it's from and can reply/call the actual school.
  const schoolPhone = (schoolRow?.phone ?? "").trim();
  const signoff = schoolPhone
    ? ` Reply or call ${schoolPhone}. — ${schoolName}`
    : ` — ${schoolName}`;

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let noPhone = 0;

  for (const a of arrears) {
    const phone = phoneById.get(a.student_id) ?? null;
    if (!phone) {
      noPhone++;
      continue;
    }
    const body = `Hello, this is a fee reminder from ${schoolName}. ${a.student_name} has an outstanding balance of ${formatMoney(
      a.balance,
    )}. Please settle it when you can. Thank you.${signoff}`;

    const r = await enqueueAndSend({
      schoolId: user.schoolId,
      toRaw: phone,
      body,
      kind: "arrears_reminder",
      refId: a.student_id,
    });

    if (r.status === "sent") sent++;
    else if (r.status === "skipped") skipped++;
    else failed++;
  }

  return { ok: true, sent, skipped, failed, noPhone };
}
