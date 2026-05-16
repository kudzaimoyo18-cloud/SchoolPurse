/**
 * Strip characters that would alter PostgREST's `.or()` filter syntax.
 *
 * `.or()` parses comma-separated `column.operator.value` triplets, where
 * `.`, `,`, `(`, `)`, `:`, `*` carry meaning. We replace each of those
 * (plus backslash) with a space so user-controlled search terms can't
 * inject new filter clauses or break parsing.
 */
export function sanitizeOrLiteral(input: string): string {
  return input
    .replace(/[\\.,():*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
