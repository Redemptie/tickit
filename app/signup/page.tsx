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
      // Show a success message — user may need to confirm their email
      setSuccess(true);
      setLoading(false);
    }
  }

  // If signup worked, show a confirmation message instead of the form
  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📬</div>
          <h1 className="text-2xl font-extrabold text-violet-600 mb-2">Check your email!</h1>
          <p className="text-gray-500 mb-6">
            We sent a confirmation link to <strong>{email}</strong>.
            Click the link in the email to activate your account.
          </p>
          <p className="text-gray-400 text-sm">
            Already confirmed?{" "}
            <Link href="/login" className="text-violet-600 font-semibold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🚀</div>
          <h1 className="text-3xl font-extrabold text-violet-600">Join TickIt!</h1>
          <p className="text-gray-400 mt-1 text-sm">Create your account and start earning points</p>
        </div>

        {/* Signup form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">

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
              minLength={6}
              placeholder="At least 6 characters"
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
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* Link to login */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </main>
  );
}
