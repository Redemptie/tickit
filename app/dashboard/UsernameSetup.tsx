"use client";

import { useState, useTransition } from "react";
import { setUsername } from "@/app/tasks/actions";

export default function UsernameSetup() {
  const [value, setValue]     = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(value);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    startTransition(async () => {
      const result = await setUsername(value);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">👤</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Set your username</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
            Choose a unique username so friends can find you. Letters, numbers, and underscores only (3–20 chars).
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value.toLowerCase()); setError(null); }}
                placeholder="your_username"
                maxLength={20}
                autoComplete="off"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl pl-7 pr-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !isValid}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 active:scale-[0.98] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shrink-0"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </form>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>
          )}
          {!error && value.length > 0 && !isValid && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {value.length < 3 ? "Too short — min 3 characters" : "Only letters, numbers, and _ allowed"}
            </p>
          )}
          {!error && isValid && (
            <p className="text-xs text-violet-500 mt-2">@{value} looks good!</p>
          )}
        </div>
      </div>
    </div>
  );
}
