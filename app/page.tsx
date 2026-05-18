"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "supabase_session_backup";

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If no backup at all, show landing immediately — no need to wait
    const hasBackup = Boolean(localStorage.getItem(SESSION_KEY));
    if (!hasBackup) {
      setReady(true);
      return;
    }

    // A backup exists. AuthProvider (parent) will call setSession() and fire SIGNED_IN.
    // Listen for that event instead of calling setSession() ourselves — avoids a
    // race condition where both callers use the same refresh token and one gets
    // rejected after token rotation.
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/dashboard");
      }
    });

    // Fallback: if SIGNED_IN never fires (e.g. expired token), clear the bad
    // backup and show the landing page after 1.5 s
    const timeout = setTimeout(() => {
      localStorage.removeItem(SESSION_KEY);
      setReady(true);
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (!ready) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center px-4 py-10">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">

        {/* App icon + name */}
        <div className="text-6xl mb-3">✅</div>
        <h1 className="text-4xl font-extrabold text-violet-600 mb-1">TickIt</h1>
        <p className="text-gray-500 dark:text-gray-300 text-lg font-medium mb-2">
          Check it. Earn it. Level up.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-7">
          The to-do app that actually makes you want to get things done.
        </p>

        {/* Feature highlights */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-8 text-left space-y-3">
          {[
            ["✅", "Create unlimited tasks"],
            ["⭐", "Earn 10 points per completed task"],
            ["🔥", "Build daily streaks"],
            ["🏆", "Unlock badges: Beginner → Legend"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold py-3 rounded-xl transition-all"
          >
            Sign Up — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="border-2 border-violet-600 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 active:scale-95 font-bold py-3 rounded-xl transition-all"
          >
            Log In
          </Link>
        </div>

        <p className="text-gray-300 dark:text-gray-600 text-xs mt-6">No ads. No spam. Just productivity. 🚀</p>
      </div>
    </main>
  );
}
