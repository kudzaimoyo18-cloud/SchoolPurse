import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { normalizePlan } from "@/lib/plan";
import type { UserRole } from "@/lib/supabase/types";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { toolDefinitions, runTool } from "@/lib/ai/tools";

// AI dashboard chat endpoint (AI tier only).
//
// Manual tool-calling loop, streamed to the client as plain-text deltas. Auth
// and the plan gate are enforced server-side here — the page gate is just UX.
// Tools are read-only and RLS-scoped (see lib/ai/tools.ts), so the worst a
// prompt-injected message can do is read the caller's own school data.

export const runtime = "nodejs";
export const maxDuration = 60;

// Default to Haiku 4.5 to keep per-query cost inside the freemium plan's
// ~$0.003–0.01 budget (the basis for the AI tier's margin). Override with
// SCHOOLPURSE_AI_MODEL=claude-opus-4-8 for maximum answer quality.
const MODEL = process.env.SCHOOLPURSE_AI_MODEL ?? "claude-haiku-4-5";

const MAX_HISTORY = 24; // cap context the client can replay
const MAX_CHARS = 4000; // per-message guard
const MAX_TOOL_ITERATIONS = 6;

type IncomingMessage = { role: "user" | "assistant"; content: string };

function sanitizeHistory(raw: unknown): IncomingMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const msgs: IncomingMessage[] = [];
  for (const m of raw.slice(-MAX_HISTORY)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string" || content.trim() === "") continue;
    msgs.push({ role, content: content.slice(0, MAX_CHARS) });
  }
  if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

export async function POST(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Not signed in." }, 401);

  const { data: profile } = await supabase
    .from("users")
    .select("role, school_id, schools(name, plan)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !(profile as { school_id?: string }).school_id) {
    return json({ error: "No school on this account." }, 403);
  }

  const school = (profile as { schools?: unknown }).schools;
  const schoolRow = Array.isArray(school)
    ? (school[0] as { name?: string; plan?: string } | undefined)
    : (school as { name?: string; plan?: string } | null);
  const plan = normalizePlan(schoolRow?.plan);

  // ── Plan gate (AI tier only) ────────────────────────────────────────────────
  if (plan !== "ai") {
    return json(
      { error: "The AI assistant is part of the AI plan.", upgrade: true },
      403,
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "AI is not configured." }, 503);

  // ── Validate input ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const history = sanitizeHistory((body as { messages?: unknown })?.messages);
  if (!history) return json({ error: "No message." }, 400);

  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt({
    schoolName: schoolRow?.name ?? null,
    role: (profile as { role: UserRole }).role,
  });
  const tools = toolDefinitions();

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) =>
        controller.enqueue(encoder.encode(text));
      try {
        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const turn = client.messages.stream({
            model: MODEL,
            max_tokens: 2048,
            system,
            tools,
            messages,
          });

          turn.on("text", (delta) => send(delta));
          const final = await turn.finalMessage();
          messages.push({ role: "assistant", content: final.content });

          if (final.stop_reason !== "tool_use") break;

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const t of toolUses) {
            const out = await runTool(
              t.name,
              (t.input ?? {}) as Record<string, unknown>,
            );
            results.push({
              type: "tool_result",
              tool_use_id: t.id,
              content: JSON.stringify(out),
            });
          }
          messages.push({ role: "user", content: results });
        }
      } catch (err) {
        // Surface the underlying Anthropic/SDK error server-side (billing,
        // rate-limit, bad key) — the user still gets a generic message.
        console.error("[assistant] stream error:", err);
        send("\n\n_Sorry — something went wrong reaching the assistant._");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
