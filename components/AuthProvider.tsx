"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "supabase_session_backup";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // On mount: if cookies were cleared (mobile swipe-away), restore session from localStorage
  useEffect(() => {
    const supabase = createClient();
    const currentPath = pathname;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) return;

      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;

      try {
        const { access_token, refresh_token } = JSON.parse(raw);
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          localStorage.removeItem(SESSION_KEY);
        } else if (currentPath === "/" || currentPath === "/login") {
          router.replace("/dashboard");
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep localStorage backup in sync with the live session
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          })
        );
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
