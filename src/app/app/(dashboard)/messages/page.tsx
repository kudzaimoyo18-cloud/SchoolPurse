import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { ensureConversations } from "./actions";
import { MessagesClient, type ConversationView } from "./messages-client";

export const metadata = { title: "Messages — SchoolPurse" };

const TYPE_RANK: Record<string, number> = {
  broadcast: 0,
  staff: 1,
  admin: 2,
  class: 3,
};

export default async function MessagesPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Provision the standard groups (+ one per class) on first visit.
  await ensureConversations();

  const isAdmin =
    user.role === "school_admin" || user.role === "platform_admin";

  const [convRes, myClassesRes] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, type, class_id, title")
      .limit(500),
    supabase.from("classes").select("id").eq("class_teacher_id", user.id),
  ]);

  const myClassIds = new Set(
    (myClassesRes.data ?? []).map((c) => (c as { id: string }).id),
  );

  const rows = (convRes.data ?? []) as Array<{
    id: string;
    type: ConversationView["type"];
    class_id: string | null;
    title: string;
  }>;

  const canPost = (type: string, classId: string | null) => {
    if (type === "staff") return true;
    if (type === "admin" || type === "broadcast") return isAdmin;
    if (type === "class") return isAdmin || (!!classId && myClassIds.has(classId));
    return false;
  };

  const conversations: ConversationView[] = rows
    .map((r) => {
      const post = canPost(r.type, r.class_id);
      return {
        id: r.id,
        type: r.type,
        title: r.title,
        canPost: post,
        // Parent notify is only meaningful where notices reach families.
        notifyEligible: post && (r.type === "broadcast" || r.type === "class"),
      };
    })
    .sort((a, b) => {
      const t = (TYPE_RANK[a.type] ?? 9) - (TYPE_RANK[b.type] ?? 9);
      return t !== 0 ? t : a.title.localeCompare(b.title);
    });

  return (
    <div className="mx-auto flex h-[calc(100svh-9rem)] w-full max-w-5xl flex-col">
      <header className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MessageSquare className="size-4.5" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-lg font-semibold leading-tight tracking-tight">
            Messages
          </h1>
          <p className="text-xs text-sp-text-sub">
            School groups in one place — no more scattered WhatsApp groups.
          </p>
        </div>
      </header>

      <MessagesClient
        conversations={conversations}
        currentUserId={user.id}
        currentUserName={user.name}
      />
    </div>
  );
}
