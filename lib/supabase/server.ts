// This file creates a Supabase client for use in server components and API routes.
// It reads cookies from the request so Supabase knows which user is logged in.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // cookies() reads the browser cookies sent with the request
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Give Supabase a way to read all cookies
        getAll() {
          return cookieStore.getAll();
        },
        // Give Supabase a way to set cookies (used during login/logout)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // Ensure cookies survive browser close on mobile
                maxAge: options?.maxAge ?? 60 * 60 * 24 * 365,
              })
            );
          } catch {
            // It's okay if this fails in pure Server Components —
            // middleware will handle refreshing the session.
          }
        },
      },
    }
  );
}
