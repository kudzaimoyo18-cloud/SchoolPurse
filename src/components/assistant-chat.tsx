"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Who owes the most right now?",
  "How much have we collected this year?",
  "How many active students do we have?",
  "Are we profitable this term?",
];

export function AssistantChat({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(next);
    setBusy(true);

    // Reserve the assistant bubble; deltas stream into it as they arrive.
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: string }).error ??
          "Something went wrong. Please try again.";
        replaceLast(msg);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        replaceLast(acc);
      }
    } catch {
      replaceLast("Couldn't reach the assistant. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function replaceLast(content: string) {
    setMessages((m) => {
      const copy = m.slice();
      copy[copy.length - 1] = { role: "assistant", content };
      return copy;
    });
  }

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-sp-card-alt/40">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5.5" strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm font-medium">
              Hi {firstName} — what would you like to know?
            </p>
            <p className="mt-1 max-w-sm text-xs text-sp-text-sub">
              I can read your fees, arrears and P&amp;L. I can&apos;t change
              anything.
            </p>
            <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} message={m} busy={busy} last={i === messages.length - 1} />)
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about fees, arrears, income…"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-sp-text-sub focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={busy || input.trim() === ""}
          aria-label="Send"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="size-4" strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}

function Bubble({
  message,
  busy,
  last,
}: {
  message: ChatMessage;
  busy: boolean;
  last: boolean;
}) {
  const isUser = message.role === "user";
  const thinking = !isUser && last && busy && message.content === "";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
            : "max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-background px-3.5 py-2 text-sm text-foreground"
        }
      >
        {thinking ? (
          <span className="inline-flex gap-1 py-0.5">
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </span>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-sp-text-sub"
      style={{ animationDelay: delay }}
    />
  );
}
