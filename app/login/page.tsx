"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "supabase_session_backup";

export default function LoginPage() {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      setChecking(false);
      return;
    }
    const client = createClient();
    try {
      const { access_token, refresh_token } = JSON.parse(raw);
      client.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (!error) {
          router.replace("/dashboard");
        } else {
          localStorage.removeItem(SESSION_KEY);
          setChecking(false);
        }
      });
    } catch {
      localStorage.removeItem(SESSION_KEY);
      setChecking(false);
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md w-full">

        <div className="text-center mb-8">
          <div className="text-5xl mb-2">✅</div>
          <h1 className="text-3xl font-extrabold text-violet-600">Welcome back!</h1>
          <p className="text-gray-400 dark:text-gray-500 mt-1 text-sm">Log in to continue your streak</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-950/40 rounded-xl py-2 px-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

        </form>

        <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-violet-600 font-semibold hover:underline">
            Sign up free
          </Link>
        </p>

      </div>
    </main>
  );
}
