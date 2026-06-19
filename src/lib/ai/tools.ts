import { createClient } from "@/lib/supabase/server";
import { fetchArrears } from "@/lib/queries/arrears";
import { fetchMonthlyPL, fetchYearToDate } from "@/lib/queries/monthly-pl";
import { toNumber } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// AI assistant tool layer.
//
// Every tool is READ-ONLY and runs through the request-scoped RLS Supabase
// client (createClient), so the model can only ever see the signed-in user's
// own school. There are deliberately no write/mutation tools — the assistant
// answers questions, it never changes data. Tool inputs reach Supabase only as
// parameterized filters (never string-concatenated SQL), so user phrasing can't
// be turned into an injection.
//
// Each executor returns a compact JSON string that goes straight back to Claude
// as the tool_result. Keep results small and pre-aggregated: the model pays for
// every token it reads.
// ─────────────────────────────────────────────────────────────────────────────

export interface AssistantTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  run: (input: Record<string, unknown>) => Promise<unknown>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Clamp a model-supplied limit into a sane range. Exported for tests. */
export function clampLimit(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

const getArrearsOverview: AssistantTool = {
  name: "get_arrears_overview",
  description:
    "Outstanding school fees: total owed across all families, how many students owe, and the heaviest debtors (name, class, balance, days overdue, parent phone for reminders). Use for any 'who owes', 'arrears', 'outstanding', or 'overdue fees' question.",
  input_schema: {
    type: "object",
    properties: {
      top: {
        type: "integer",
        description: "How many of the heaviest debtors to list (default 10, max 50).",
      },
    },
  },
  async run(input) {
    const top = clampLimit(input.top, 10, 50);
    const arrears = await fetchArrears();
    const totalOutstanding = round2(
      arrears.reduce((s, a) => s + a.balance, 0),
    );
    const debtors = arrears.slice(0, top).map((a) => ({
      student: a.student_name,
      class: a.class_name,
      balance: round2(a.balance),
      term_fee: round2(a.term_fee),
      paid: round2(a.paid),
      days_overdue: a.days_overdue,
    }));
    return {
      total_outstanding_usd: totalOutstanding,
      students_owing: arrears.length,
      top_debtors: debtors,
    };
  },
};

const getFinancialSummary: AssistantTool = {
  name: "get_financial_summary",
  description:
    "Income, expenses, net profit and margin for the school: year-to-date totals plus a trailing month-by-month profit & loss. Use for 'how much have we collected', 'are we profitable', 'income this year', 'expenses', or any revenue/P&L question.",
  input_schema: {
    type: "object",
    properties: {
      months: {
        type: "integer",
        description: "How many trailing months of P&L to include (default 6, max 12).",
      },
    },
  },
  async run(input) {
    const months = clampLimit(input.months, 6, 12);
    const [ytd, monthly] = await Promise.all([
      fetchYearToDate(),
      fetchMonthlyPL(months),
    ]);
    return {
      year_to_date: {
        income_usd: round2(ytd.income),
        expenses_usd: round2(ytd.expenses),
        net_usd: round2(ytd.net),
        margin_pct: round2(ytd.margin),
      },
      monthly: monthly.map((m) => ({
        month: m.label,
        income_usd: round2(m.income),
        expenses_usd: round2(m.expenses),
        net_usd: round2(m.net),
      })),
    };
  },
};

const findStudent: AssistantTool = {
  name: "find_student",
  description:
    "Look up a specific student by name. Returns their class, fee balance, parent name and phone, and home address. Use when the user names a child, e.g. 'what does Tariro Moyo owe', 'is Aiden paid up', 'phone number for Leeroy's parent'.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Full or partial student name to search for.",
      },
    },
    required: ["name"],
  },
  async run(input) {
    const name = String(input.name ?? "").trim();
    if (!name) return { error: "No name provided." };
    const supabase = await createClient();

    // Match first name, last name, or the two combined. ilike args are passed
    // as bound parameters by the client — safe from injection.
    const pattern = `%${name}%`;
    const { data, error } = await supabase
      .from("students")
      .select(
        "id, first_name, last_name, status, parent_name, parent_phone, home_address, classes(name)",
      )
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`)
      .limit(8);

    if (error) return { error: "Lookup failed." };
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    if (rows.length === 0) return { matches: [], note: "No student found." };

    // Pull balances once and index by student id so we can annotate matches.
    const arrears = await fetchArrears();
    const balanceById = new Map(arrears.map((a) => [a.student_id, a.balance]));

    const matches = rows.map((r) => {
      const cls = r.classes as { name?: string } | { name?: string }[] | null;
      const className = Array.isArray(cls) ? cls[0]?.name : cls?.name;
      return {
        name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
        class: className ?? null,
        status: r.status ?? null,
        balance_usd: round2(toNumber(balanceById.get(r.id as string) ?? 0)),
        parent_name: r.parent_name ?? null,
        parent_phone: r.parent_phone ?? null,
        home_address: r.home_address ?? null,
      };
    });
    return { matches };
  },
};

const getSchoolStats: AssistantTool = {
  name: "get_school_stats",
  description:
    "Enrolment overview: number of active students, number of classes, and the active head-count per class. Use for 'how many students do we have', 'class sizes', 'how many kids in Grade 3'.",
  input_schema: { type: "object", properties: {} },
  async run() {
    const supabase = await createClient();
    const [{ data: students }, { data: classes }] = await Promise.all([
      supabase.from("students").select("class_id, status").limit(20000),
      supabase.from("classes").select("id, name").order("name"),
    ]);

    const active = (students ?? []).filter(
      (s) => (s as { status?: string }).status === "active",
    );
    const countByClass = new Map<string, number>();
    for (const s of active) {
      const cid = (s as { class_id?: string }).class_id;
      if (cid) countByClass.set(cid, (countByClass.get(cid) ?? 0) + 1);
    }
    const perClass = (classes ?? []).map((c) => {
      const row = c as { id: string; name: string };
      return { class: row.name, active_students: countByClass.get(row.id) ?? 0 };
    });

    return {
      active_students: active.length,
      classes: perClass.length,
      per_class: perClass,
    };
  },
};

export const ASSISTANT_TOOLS: AssistantTool[] = [
  getArrearsOverview,
  getFinancialSummary,
  findStudent,
  getSchoolStats,
];

/** Anthropic tool definitions (no executor) for the API request. */
export function toolDefinitions() {
  return ASSISTANT_TOOLS.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));
}

/** Run a tool by name; never throws — returns an error payload instead. */
export async function runTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const tool = ASSISTANT_TOOLS.find((t) => t.name === name);
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    return await tool.run(input ?? {});
  } catch {
    return { error: `Tool ${name} failed to run.` };
  }
}
