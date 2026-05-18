"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { timezone: tz } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center px-4 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl leading-none">📬</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">Check your email!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            We sent a confirmation link to
          </p>
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-6">{email}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Already confirmed?{" "}
            <Link href="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center px-4 py-12">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 max-w-md w-full">

        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-violet-900/50 mb-3">
            <span className="text-2xl leading-none">🚀</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">Join TickIt!</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your account and start earning points</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3.5 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3.5 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all text-sm"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <span className="text-red-500 text-sm leading-5">⚠</span>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 active:scale-[0.98] active:translate-y-0 text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-md shadow-violet-200 dark:shadow-violet-950/50"
          >
            {loading ? "Creating account…" : "Create Account →"}
          </button>

        </form>

        <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </main>
  );
}
