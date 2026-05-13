/**
 * Placeholder Database types for SchoolPurse.
 *
 * Replace this file with the output of:
 *   npx supabase gen types typescript --project-id vranahcabvbpbgrajafx > src/lib/supabase/types.ts
 *
 * (Requires `supabase login`.)
 *
 * Until proper types are generated, we type the Database loosely so that
 * supabase-js's column inference doesn't collapse to `never`. The exported
 * enums below match the live schema observed via PostgREST introspection.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UserRole = "platform_admin" | "school_admin" | "bursar" | "teacher";
export type SchoolStatus = "trial" | "active" | "suspended" | "closed";
export type StudentStatus = "active" | "withdrawn";
export type PaymentMethod = "cash" | "bank_transfer" | "mobile_money";
export type PaymentStatus = "completed" | "void";
export type InvoiceStatus = "open" | "partial" | "paid" | "void";
export type FeeRecurrence = "per_term" | "per_month" | "one_off";

export type Database = any;
