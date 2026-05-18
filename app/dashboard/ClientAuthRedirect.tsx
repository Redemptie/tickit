"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // If AuthProvider restores the session, SIGNED_IN fires — refresh so the
    // server re-renders the dashboard with the restored session cookies.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.refresh();
      }
    });

    // Give AuthProvider time to read localStorage and call setSession().
    // If no session appears within 1.5 s, the user is truly logged out.
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
    </div>
  );
}
