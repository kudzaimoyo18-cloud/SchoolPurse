import { createClient } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";
import { format } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "receipt_number, amount_usd, method, paid_at, status, payer_name_snapshot, students(first_name, last_name, classes(name))",
    )
    .order("paid_at", { ascending: false })
    .limit(10000);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []).map((p: Record<string, unknown>) => {
    const studentField = p.students as
      | { first_name?: string; last_name?: string; classes?: unknown }
      | Array<{ first_name?: string; last_name?: string; classes?: unknown }>
      | null;
    const s = Array.isArray(studentField) ? studentField[0] : studentField;
    const classField = s?.classes as
      | { name?: string }
      | { name?: string }[]
      | undefined;
    const className = Array.isArray(classField)
      ? classField[0]?.name
      : classField?.name;
    return {
      receipt: p.receipt_number,
      student: s ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() : "",
      class: className ?? "",
      amount_usd: p.amount_usd,
      method: p.method,
      paid_at: p.paid_at,
      status: p.status,
      payer: p.payer_name_snapshot ?? "",
    };
  });

  const csv = toCsv(rows, [
    "receipt",
    "student",
    "class",
    "amount_usd",
    "method",
    "paid_at",
    "status",
    "payer",
  ]);
  const filename = `schoolpurse-payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
  return csvResponse(csv, filename);
}
