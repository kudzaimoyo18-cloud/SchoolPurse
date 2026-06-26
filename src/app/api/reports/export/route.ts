import { format } from "date-fns";
import { fetchMonthlyPL } from "@/lib/queries/monthly-pl";
import { csvResponse, toCsv } from "@/lib/csv";
import { authorizeApi, FINANCE_ROLES } from "@/lib/auth/api-guard";

export async function GET() {
  const auth = await authorizeApi(FINANCE_ROLES);
  if (!auth.ok) return auth.response;

  const data = await fetchMonthlyPL(12);
  const rows = data.map((m) => ({
    month: m.label,
    income_usd: m.income.toFixed(2),
    expenses_usd: m.expenses.toFixed(2),
    net_usd: m.net.toFixed(2),
    margin_pct: m.margin.toFixed(2),
  }));
  const csv = toCsv(rows, [
    "month",
    "income_usd",
    "expenses_usd",
    "net_usd",
    "margin_pct",
  ]);
  return csvResponse(
    csv,
    `schoolpurse-monthly-pl-${format(new Date(), "yyyy-MM-dd")}.csv`,
  );
}
