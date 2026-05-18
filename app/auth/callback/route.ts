// This route handles the redirect after a user clicks a confirmation email link.
// Supabase sends users back here with a "code" in the URL, which we exchange for a session.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Swap the one-time code for a real session
    await supabase.auth.exchangeCodeForSession(code);

    // On first confirmation the user's detected timezone is stored in metadata.
    // Save it to the profile once here — this route only runs on email confirmation,
    // never on regular logins, so it won't overwrite later manual changes.
    const { data: { user } } = await supabase.auth.getUser();
    const tz = user?.user_metadata?.timezone;
    if (user && tz) {
      await supabase.from("profiles").update({ timezone: tz }).eq("id", user.id);
    }
  }

  // Send the user to the dashboard after confirming their email
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
