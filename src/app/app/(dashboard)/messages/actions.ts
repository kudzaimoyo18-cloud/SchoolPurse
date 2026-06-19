"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

// Server actions for in-app messaging. RLS does the real authorization (see the
// messaging migration) — these just validate input and attach the sender.

const MAX_BODY = 4000;

export async function ensureConversations(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("ensure_school_conversations");
}

export async function sendMessage(
  conversationId: string,
  body: string,
  notifyParents = false,
): Promise<{ error?: string }> {
  const text = body.trim();
  if (!conversationId) return { error: "No conversation." };
  if (text === "") return { error: "Message is empty." };
  if (text.length > MAX_BODY) return { error: "Message is too long." };

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: text,
    notify_parents: notifyParents,
  });

  // RLS rejects posts the user isn't allowed to make.
  if (error) return { error: "Couldn't send. You may not have access here." };
  return {};
}

export async function markRead(conversationId: string): Promise<void> {
  if (!conversationId) return;
  const user = await getCurrentUser();
  const supabase = await createClient();
  await supabase.from("conversation_reads").upsert(
    {
      conversation_id: conversationId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id,user_id" },
  );
}
