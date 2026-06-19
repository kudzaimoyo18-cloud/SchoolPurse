"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EnsureRoomResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

const Schema = z.object({
  scope: z.enum(["class", "staff", "admins"]),
  class_id: z.string().uuid().nullable(),
});

function newSlug(): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? "";
  const rand = uuid
    ? uuid.replace(/-/g, "")
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `sp-${rand}`;
}

/**
 * Get-or-create the meeting room for a scope (and class). Returns its slug,
 * which is both the video room name and the student share-link capability.
 * RLS limits everything to the caller's school + staff role.
 */
export async function ensureRoom(payload: unknown): Promise<EnsureRoomResult> {
  const parsed = Schema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Invalid room request" };
  const { scope, class_id } = parsed.data;
  if (scope === "class" && !class_id) {
    return { ok: false, error: "Pick a class first." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("users")
    .select("id, school_id, role")
    .eq("id", auth.user.id)
    .maybeSingle();
  const p = profile as
    | { id?: string; school_id?: string; role?: string }
    | null;
  if (!p?.school_id) return { ok: false, error: "No school assigned" };
  if (
    scope === "admins" &&
    p.role !== "school_admin" &&
    p.role !== "platform_admin"
  ) {
    return { ok: false, error: "The admins room is for admins only." };
  }

  const findExisting = () => {
    let q = supabase
      .from("meeting_rooms")
      .select("slug")
      .eq("school_id", p.school_id!)
      .eq("scope", scope);
    q = scope === "class" ? q.eq("class_id", class_id!) : q.is("class_id", null);
    return q.maybeSingle();
  };

  const { data: existing } = await findExisting();
  if (existing) return { ok: true, slug: (existing as { slug: string }).slug };

  let label = scope === "staff" ? "Staff room" : "Admins room";
  if (scope === "class" && class_id) {
    const { data: cls } = await supabase
      .from("classes")
      .select("name")
      .eq("id", class_id)
      .maybeSingle();
    label = (cls as { name?: string } | null)?.name ?? "Class room";
  }

  const { data: ins, error } = await supabase
    .from("meeting_rooms")
    .insert({
      school_id: p.school_id,
      scope,
      class_id: scope === "class" ? class_id : null,
      label,
      slug: newSlug(),
      created_by: p.id,
    })
    .select("slug")
    .maybeSingle();

  if (error || !ins) {
    // Lost a race on the unique index — re-fetch the row someone else created.
    const { data: again } = await findExisting();
    if (again) return { ok: true, slug: (again as { slug: string }).slug };
    return { ok: false, error: error?.message ?? "Could not start the room" };
  }
  return { ok: true, slug: (ins as { slug: string }).slug };
}
