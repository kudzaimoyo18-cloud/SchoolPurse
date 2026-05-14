import { format } from "date-fns";
import { fetchArrears } from "@/lib/queries/arrears";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const arrears = await fetchArrears();
  const rows = arrears.map((a) => ({
    student: a.student_name,
    class: a.class_name ?? "",
    term_fee_usd: a.term_fee.toFixed(2),
    paid_usd: a.paid.toFixed(2),
    balance_usd: a.balance.toFixed(2),
    days_overdue: a.days_overdue,
    status:
      a.days_overdue > 60
        ? "critical"
        : a.days_overdue > 30
          ? "moderate"
          : "recent",
  }));
  const csv = toCsv(rows, [
    "student",
    "class",
    "term_fee_usd",
    "paid_usd",
    "balance_usd",
    "days_overdue",
    "status",
  ]);
  return csvResponse(
    csv,
    `schoolpurse-arrears-${format(new Date(), "yyyy-MM-dd")}.csv`,
  );
}
