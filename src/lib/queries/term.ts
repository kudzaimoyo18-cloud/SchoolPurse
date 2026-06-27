import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Cookie that holds the globally-selected term id. Read by server components,
// written client-side by the topbar TermSelector. Kept here as the single
// source of truth for the name (the client component inlines the literal since
// it can't import this server-only module).
export const ACTIVE_TERM_COOKIE = "sp_term";

export interface TermOption {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  year: string | null;
}

export interface ActiveTermResult {
  /** The resolved active term: cookie selection, else the current term, else newest. */
  active: TermOption | null;
  /** All terms for the school, newest first — feeds the selector dropdown. */
  terms: TermOption[];
}

/**
 * Resolve the school's terms and which one is "active" for this request.
 *
 * Active term precedence: the `sp_term` cookie (if it names a term that still
 * exists for this school — RLS scopes the list, so a stale cookie from another
 * school is ignored), then the `is_current` term, then the newest term.
 *
 * React-cached so the layout, topbar and pages share one query per render.
 */
export const getActiveTerm = cache(async (): Promise<ActiveTermResult> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("terms")
    .select("id, name, start_date, end_date, is_current, academic_years(name)")
    .order("start_date", { ascending: false });

  const terms: TermOption[] = (data ?? []).map((t: Record<string, unknown>) => {
    const ay = t.academic_years as
      | { name?: string }
      | { name?: string }[]
      | null;
    const year = Array.isArray(ay) ? (ay[0]?.name ?? null) : (ay?.name ?? null);
    return {
      id: t.id as string,
      name: t.name as string,
      start_date: (t.start_date as string) ?? null,
      end_date: (t.end_date as string) ?? null,
      is_current: !!t.is_current,
      year,
    };
  });

  const cookieStore = await cookies();
  const cookieId = cookieStore.get(ACTIVE_TERM_COOKIE)?.value;
  let active = cookieId
    ? (terms.find((t) => t.id === cookieId) ?? null)
    : null;
  if (!active) active = terms.find((t) => t.is_current) ?? terms[0] ?? null;

  return { active, terms };
});

/** Human label like "Term 2 · 2026" for an active term, or undefined. */
export function termLabel(term: TermOption | null | undefined): string | undefined {
  if (!term) return undefined;
  return term.year ? `${term.name} · ${term.year}` : term.name;
}
