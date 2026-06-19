"use client";

import { useEffect, useRef, useState } from "react";
import {
  Megaphone,
  Users,
  ShieldCheck,
  GraduationCap,
  Send,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markRead } from "./actions";

export type ConversationView = {
  id: string;
  type: "staff" | "admin" | "broadcast" | "class";
  title: string;
  canPost: boolean;
  notifyEligible: boolean;
};

type Message = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  notify_parents: boolean;
};

const TYPE_META: Record<
  ConversationView["type"],
  { icon: LucideIcon; hint: string }
> = {
  broadcast: { icon: Megaphone, hint: "Admins post · all staff see" },
  staff: { icon: Users, hint: "All staff" },
  admin: { icon: ShieldCheck, hint: "Admins only" },
  class: { icon: GraduationCap, hint: "Class teacher & admins" },
};

type Props = {
  conversations: ConversationView[];
  currentUserId: string;
  currentUserName: string;
};

export function MessagesClient({
  conversations,
  currentUserId,
  currentUserName,
}: Props) {
  const [supabase] = useState(() => createClient());
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [notify, setNotify] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);

  const nameById = useRef<Map<string, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  // Load history + subscribe to live inserts for the selected conversation.
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setLoading(true);
    setMessages([]);
    setNotify(false);

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender_id, created_at, notify_parents, users(name)")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true })
        .limit(300);
      if (!active) return;
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      for (const r of rows) {
        const u = r.users as { name?: string } | { name?: string }[] | null;
        const name = Array.isArray(u) ? u[0]?.name : u?.name;
        if (name) nameById.current.set(r.sender_id as string, name);
      }
      nameById.current.set(currentUserId, currentUserName);
      setMessages(rows.map(toMessage));
      setLoading(false);
    })();

    void markRead(selectedId);

    const channel = supabase
      .channel(`messages:${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const m = toMessage(payload.new as Record<string, unknown>);
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [selectedId, supabase, currentUserId, currentUserName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    const res = await sendMessage(selectedId, text, notify && selected?.notifyEligible === true);
    setSending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setInput("");
    setNotify(false);
  }

  function openConversation(id: string) {
    setSelectedId(id);
    setMobileThread(true);
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Conversation list */}
      <aside
        className={`${
          mobileThread ? "hidden" : "flex"
        } w-full flex-col border-r border-border sm:flex sm:w-64 sm:shrink-0`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversations.map((c) => {
            const Meta = TYPE_META[c.type];
            const isActive = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => openConversation(c.id)}
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-sp-card-alt/60 hover:text-foreground"
                }`}
              >
                <Meta.icon
                  className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-sp-text-sub"}`}
                  strokeWidth={1.9}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {c.title}
                  </span>
                  <span className="block truncate text-[11px] text-sp-text-sub">
                    {TYPE_META[c.type].hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Thread */}
      <section
        className={`${
          mobileThread ? "flex" : "hidden"
        } min-w-0 flex-1 flex-col sm:flex`}
      >
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <button
                type="button"
                onClick={() => setMobileThread(false)}
                className="-ml-1 rounded-md p-1 text-muted-foreground hover:text-foreground sm:hidden"
                aria-label="Back"
              >
                <ArrowLeft className="size-4" />
              </button>
              <h2 className="text-sm font-semibold">{selected.title}</h2>
              <span className="text-[11px] text-sp-text-sub">
                · {TYPE_META[selected.type].hint}
              </span>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
              {loading ? (
                <p className="py-8 text-center text-xs text-sp-text-sub">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-xs text-sp-text-sub">
                  No messages yet.
                </p>
              ) : (
                messages.map((m) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    mine={m.sender_id === currentUserId}
                    senderName={
                      nameById.current.get(m.sender_id) ?? "Staff"
                    }
                  />
                ))
              )}
            </div>

            {selected.canPost ? (
              <div className="border-t border-border p-3">
                {selected.notifyEligible ? (
                  <label className="mb-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                      className="size-3.5 accent-[var(--primary)]"
                    />
                    Also notify parents by WhatsApp/SMS
                    <span className="text-sp-text-sub">(activates once WhatsApp is connected)</span>
                  </label>
                ) : null}
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Write a message…"
                    className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-sp-text-sub focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || input.trim() === ""}
                    aria-label="Send"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                  >
                    <Send className="size-4" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-border px-4 py-3 text-center text-[11.5px] text-sp-text-sub">
                You can read this group but only {TYPE_META[selected.type].hint.toLowerCase()} can post.
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-sp-text-sub">
            No conversations yet.
          </div>
        )}
      </section>
    </div>
  );
}

function MessageRow({
  message,
  mine,
  senderName,
}: {
  message: Message;
  mine: boolean;
  senderName: string;
}) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className="max-w-[80%]">
        {!mine ? (
          <p className="mb-0.5 px-1 text-[11px] font-medium text-sp-text-sub">
            {senderName}
          </p>
        ) : null}
        <div
          className={
            mine
              ? "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
              : "rounded-2xl rounded-bl-sm border border-border bg-sp-card-alt/50 px-3 py-2 text-sm text-foreground"
          }
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
        </div>
        <p
          className={`mt-0.5 px-1 text-[10px] text-sp-text-sub ${mine ? "text-right" : ""}`}
        >
          {message.notify_parents ? "Sent to parents · " : ""}
          {time}
        </p>
      </div>
    </div>
  );
}

function toMessage(r: Record<string, unknown>): Message {
  return {
    id: r.id as string,
    body: r.body as string,
    sender_id: r.sender_id as string,
    created_at: r.created_at as string,
    notify_parents: Boolean(r.notify_parents),
  };
}
