// A cell is dangerous if a spreadsheet (Excel/Sheets/LibreOffice) would treat
// its leading character as the start of a formula: = + - @ and the control
// chars TAB / CR. Genuine numbers (incl. negatives like "-5.00") are exempt so
// we don't corrupt numeric columns. See OWASP "CSV Injection".
const FORMULA_LEAD = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

/**
 * Neutralise spreadsheet formula injection by prefixing a risky cell with a
 * single quote, which forces the spreadsheet to treat it as literal text.
 * User-entered values (student/parent names, notes, payer) flow into these
 * exports, so an attacker-chosen name like `=HYPERLINK(...)` would otherwise
 * execute when a bursar opens the file.
 */
export function neutralizeFormula(s: string): string {
  if (FORMULA_LEAD.test(s) && !PLAIN_NUMBER.test(s)) return "'" + s;
  return s;
}

/**
 * Encode an array of records as CSV text.
 * Neutralises spreadsheet formula injection, then quote-escapes any cell
 * containing comma, quote, or newline.
 */
export function toCsv(
  rows: Record<string, unknown>[],
  headers?: string[],
): string {
  if (rows.length === 0) return (headers ?? []).join(",") + "\n";
  const cols = headers ?? Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = neutralizeFormula(String(val));
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [cols.join(",")];
  for (const row of rows) {
    lines.push(cols.map((c) => escape(row[c])).join(","));
  }
  return lines.join("\n") + "\n";
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
