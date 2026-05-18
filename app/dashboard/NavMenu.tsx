"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import TimezoneBar from "@/app/dashboard/TimezoneBar";
import ThemeToggle from "@/components/ThemeToggle";

export default function NavMenu({ email, timezone }: { email: string; timezone: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      {/* ── Desktop (sm+): full inline bar ── */}
      <div className="hidden sm:flex items-center gap-3">
        <Link
          href="/progress"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-2 py-1"
        >
          📊 Progress
        </Link>
        <Link
          href="/friends"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-2 py-1"
        >
          👥 Friends
        </Link>
        <TimezoneBar initialTimezone={timezone} />
        <span className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-[160px]">{email}</span>
        <ThemeToggle />
        <form action={logout}>
          <button
            type="submit"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 active:scale-95 text-gray-600 dark:text-gray-300 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            Log Out
          </button>
        </form>
      </div>

      {/* ── Mobile (<sm): hamburger + dropdown ── */}
      <div className="flex sm:hidden items-center relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden z-50">

            {/* Progress link */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Link
                href="/progress"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <span>📊</span>
                <span>Weekly Progress</span>
              </Link>
            </div>

            {/* Friends link */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Link
                href="/friends"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <span>👥</span>
                <span>Friends</span>
              </Link>
            </div>

            {/* Email */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">Signed in as</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{email}</p>
            </div>

            {/* Timezone */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">Timezone</p>
              <TimezoneBar initialTimezone={timezone} />
            </div>

            {/* Dark mode */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Dark mode</span>
              <ThemeToggle />
            </div>

            {/* Log out */}
            <div className="px-4 py-3">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full text-left text-sm font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Log Out
                </button>
              </form>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
