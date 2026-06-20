// Phone normalisation for Zimbabwe mobile numbers → E.164 (+263…).
//
// Pure + framework-free so it's unit-tested and shared by the send pipe.
// Zim mobile numbers are 9 digits after the country code, starting with 7
// (e.g. national 0772 123 456 → +263772123456). Anything that doesn't fit
// that shape returns null so the caller can flag it rather than send garbage.

export function normalizeZimPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Drop spaces, dashes, dots, slashes, parens.
  let s = raw.replace(/[\s\-().\/]/g, "");

  // Leading + or 00 international prefix.
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);

  if (!/^\d+$/.test(s)) return null;

  // Country code present.
  if (s.startsWith("263")) {
    const rest = s.slice(3);
    return isZimMobileSubscriber(rest) ? "+263" + rest : null;
  }

  // National format with trunk 0.
  if (s.startsWith("0")) {
    const rest = s.slice(1);
    return isZimMobileSubscriber(rest) ? "+263" + rest : null;
  }

  // Bare subscriber number (9 digits starting 7).
  return isZimMobileSubscriber(s) ? "+263" + s : null;
}

/** 9 digits, first digit 7 — the Zim mobile subscriber shape. */
function isZimMobileSubscriber(digits: string): boolean {
  return /^7\d{8}$/.test(digits);
}
