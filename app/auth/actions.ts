// Server Actions for authentication.
// "use server" means this code only runs on the server — never in the browser.
// This is the safest place to handle signout.

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Send user back to the login page after signing out
  redirect("/login");
}
