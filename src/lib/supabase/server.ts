import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Optional cross-subdomain cookie domain so the session spans the
          // apex + dashboard subdomain. Unset by default (no behaviour change).
          const domain = process.env.AUTH_COOKIE_DOMAIN;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, domain ? { ...options, domain } : options),
            );
          } catch {
            // Called from a Server Component — proxy refreshes the session.
          }
        },
      },
    },
  );
}
