import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeZimPhone } from "./phone";
import { getProvider } from "./provider";

// Enqueue + deliver one outbound message. Always records a row in
// outbound_messages so there's an audit trail regardless of outcome:
//   - invalid/missing phone        -> status "failed"  (never reaches a provider)
//   - no provider configured       -> status "skipped" (stored, ready to send)
//   - provider accepted            -> status "sent"
//   - provider rejected/threw      -> status "failed"  (with the error)
//
// Writes use the admin client (bypasses RLS); the caller is responsible for
// authorising the user before calling this.

export type SendStatus = "sent" | "skipped" | "failed" | "invalid";

export interface EnqueueInput {
  schoolId: string;
  toRaw: string | null | undefined;
  body: string;
  kind?: string;
  refId?: string | null;
}

export async function enqueueAndSend(
  input: EnqueueInput,
): Promise<{ status: SendStatus }> {
  // Generated DB types don't track this table yet; widen to the untyped client.
  const admin = createAdminClient() as unknown as SupabaseClient;
  const kind = input.kind ?? "manual";
  const refId = input.refId ?? null;

  const phone = normalizeZimPhone(input.toRaw);
  if (!phone) {
    await admin.from("outbound_messages").insert({
      school_id: input.schoolId,
      to_phone: input.toRaw ?? "",
      body: input.body,
      kind,
      ref_id: refId,
      status: "failed",
      error: "invalid_or_missing_phone",
    });
    return { status: "invalid" };
  }

  const { data: row, error } = await admin
    .from("outbound_messages")
    .insert({
      school_id: input.schoolId,
      to_phone: phone,
      body: input.body,
      kind,
      ref_id: refId,
      status: "queued",
    })
    .select("id")
    .single();

  if (error || !row) return { status: "failed" };
  const id = (row as { id: string }).id;

  const provider = getProvider();
  if (!provider) {
    await admin
      .from("outbound_messages")
      .update({ status: "skipped", error: "no_provider_configured" })
      .eq("id", id);
    return { status: "skipped" };
  }

  try {
    const res = await provider.sendWhatsApp(phone, input.body);
    await admin
      .from("outbound_messages")
      .update({
        status: "sent",
        provider: provider.name,
        provider_message_id: res.id ?? null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);
    return { status: "sent" };
  } catch (e) {
    await admin
      .from("outbound_messages")
      .update({
        status: "failed",
        provider: provider.name,
        error: (e instanceof Error ? e.message : "send_failed").slice(0, 500),
      })
      .eq("id", id);
    return { status: "failed" };
  }
}
