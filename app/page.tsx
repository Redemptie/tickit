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
    const hasBackup = Boolean(localStorage.getItem(SESSION_KEY));
    if (!hasBackup) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/dashboard");
      }
    });

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
      <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center px-4 py-12 overflow-hidden">

      {/* Subtle depth glow behind the card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 max-w-md w-full">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-300 dark:shadow-violet-900/50 mb-4">
            <span className="text-3xl leading-none">✅</span>
          </div>
          <h1 className="text-4xl font-extrabold text-violet-600 tracking-tight">TickIt</h1>
          <p className="text-gray-600 dark:text-gray-300 font-semibold mt-1">
            Check it. Earn it. Level up.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 text-center">
            The to-do app that makes getting things done feel like a game.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-7">
          {[
            { icon: "✅", label: "Unlimited tasks",  accent: "bg-green-50  dark:bg-green-950/40  border-green-100  dark:border-green-900/60"  },
            { icon: "⭐", label: "Earn 10+ pts/task", accent: "bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/60" },
            { icon: "🔥", label: "Daily streaks",    accent: "bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/60" },
            { icon: "🏆", label: "Unlock badges",    accent: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-100 dark:border-yellow-900/60" },
          ].map(({ icon, label, accent }) => (
            <div key={label} className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 ${accent}`}>
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="bg-violet-600 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-300 dark:hover:shadow-violet-900/50 active:scale-[0.98] active:translate-y-0 text-white font-bold py-3.5 rounded-xl transition-all text-center shadow-md shadow-violet-200 dark:shadow-violet-950/50 text-sm"
          >
            Get Started Free →
          </Link>
          <Link
            href="/login"
            className="border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 active:scale-[0.98] font-semibold py-3.5 rounded-xl transition-all text-center text-sm"
          >
            Log In
          </Link>
        </div>

        <p className="text-gray-300 dark:text-gray-600 text-xs text-center mt-5">
          No ads. No spam. Just productivity.
        </p>

      </div>
    </main>
  );
}
