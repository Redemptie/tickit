"use client";

// "use client" means this component runs in the browser.
// We need this because it uses useState and responds to user input.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); // stop page from refreshing on form submit
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Save the browser's timezone to the user's profile
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await supabase.from("profiles").update({ timezone: tz }).eq("id", data.user.id);
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">✅</div>
          <h1 className="text-3xl font-extrabold text-violet-600">Welcome back!</h1>
          <p className="text-gray-400 mt-1 text-sm">Log in to continue your streak</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Show any error message here */}
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-2 px-4">
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

        {/* Link to signup */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-violet-600 font-semibold hover:underline">
            Sign up free
          </Link>
        </p>

      </div>
    </main>
  );
}
