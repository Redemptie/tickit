// This file creates a Supabase client for use in browser (client) components.
// Use this whenever you need to talk to Supabase from a component marked "use client".

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
