import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser (client-side) Supabase client.
 * Use this inside Client Components ("use client").
 * A single instance is created per module load — safe for React renders.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
