"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ExpenseSchema = z.object({
  expense_date: z.string().min(1),
  description: z.string().trim().min(1, "Description required"),
  amount_usd: z.coerce.number().positive("Amount must be positive"),
  category_id: z.string().uuid().nullish().or(z.literal("")),
  payee: z.string().trim().optional().or(z.literal("")),
});

async function getCtx() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("id, school_id")
    .eq("id", user.user.id)
    .maybeSingle();
  if (!profile?.school_id) return null;
  return {
    supabase,
    userId: profile.id as string,
    schoolId: profile.school_id as string,
  };
}

export async function createExpense(formData: FormData): Promise<ActionResult> {
  const parsed = ExpenseSchema.safeParse({
    expense_date: formData.get("expense_date"),
    description: formData.get("description"),
    amount_usd: formData.get("amount_usd"),
    category_id: formData.get("category_id") || null,
    payee: formData.get("payee") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const ctx = await getCtx();
  if (!ctx) return { ok: false, error: "Not authenticated" };
  const { supabase, schoolId, userId } = ctx;

  const { error } = await supabase.from("expenses").insert({
    school_id: schoolId,
    category_id: parsed.data.category_id || null,
    amount_usd: parsed.data.amount_usd,
    payee: parsed.data.payee || null,
    description: parsed.data.description,
    expense_date: parsed.data.expense_date,
    recorded_by: userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/expenses");
  revalidatePath("/overview");
  revalidatePath("/reports");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return { ok: false, error: "Not authenticated" };
  const { error } = await ctx.supabase.from("expenses").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/overview");
  revalidatePath("/reports");
  return { ok: true };
}

export async function createCategory(name: string): Promise<ActionResult> {
  if (!name.trim()) return { ok: false, error: "Name required" };
  const ctx = await getCtx();
  if (!ctx) return { ok: false, error: "Not authenticated" };
  const { error } = await ctx.supabase.from("expense_categories").insert({
    school_id: ctx.schoolId,
    name: name.trim(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/expenses");
  return { ok: true };
}
