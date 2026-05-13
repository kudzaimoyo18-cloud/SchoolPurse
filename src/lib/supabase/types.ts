/**
 * Placeholder Database types for SchoolPurse.
 *
 * Replace this file with output of:
 *   npx supabase gen types typescript --project-id vranahcabvbpbgrajafx > src/lib/supabase/types.ts
 *
 * (Requires `supabase login` + project linked, or pass --access-token.)
 *
 * Until then, these hand-written enums + minimal table types match the live schema
 * observed via PostgREST introspection.
 */

export type UserRole = "platform_admin" | "school_admin" | "bursar" | "teacher";
export type SchoolStatus = "trial" | "active" | "suspended" | "closed";
export type StudentStatus = "active" | "withdrawn";
export type PaymentMethod = "cash" | "bank_transfer" | "mobile_money";
export type PaymentStatus = "completed" | "void";
export type InvoiceStatus = "open" | "partial" | "paid" | "void";
export type FeeRecurrence = "per_term" | "per_month" | "one_off";

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      user_role: UserRole;
      school_status: SchoolStatus;
      student_status: StudentStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      invoice_status: InvoiceStatus;
      fee_recurrence: FeeRecurrence;
    };
  };
}
