// Parsing for the optional CSV opening-balance column — the amount a student
// still owes at import time (fees carried over from before SchoolPurse). Kept
// in its own module (not the "use server" actions file, which may only export
// async functions) so it can be unit-tested directly.

export const MAX_OPENING_BALANCE = 1_000_000;

/**
 * Parse an opening-balance cell. Strips `$` and thousands separators.
 * @returns the amount (>= 0) when present and valid — a blank cell is 0 —
 *          or `null` when the cell is present but not a valid non-negative
 *          number, so the caller can surface a row-level error.
 */
export function parseOpeningBalance(raw: string | undefined): number | null {
  if (raw === undefined) return 0;
  const v = raw.trim().replace(/[$,\s]/g, "");
  if (!v) return 0;
  // Number() (not parseFloat) so trailing garbage like "12x" is rejected
  // rather than silently truncated to 12.
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > MAX_OPENING_BALANCE) return null;
  return Math.round(n * 100) / 100;
}
