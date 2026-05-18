"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateTimezone } from "@/app/tasks/actions";

const TIMEZONES = [
  { value: "Pacific/Midway",          label: "UTC−11 — Midway Island" },
  { value: "Pacific/Honolulu",        label: "UTC−10 — Honolulu" },
  { value: "America/Anchorage",       label: "UTC−9  — Anchorage" },
  { value: "America/Los_Angeles",     label: "UTC−8  — Los Angeles, Seattle" },
  { value: "America/Denver",          label: "UTC−7  — Denver, Phoenix" },
  { value: "America/Chicago",         label: "UTC−6  — Chicago, Mexico City" },
  { value: "America/New_York",        label: "UTC−5  — New York, Toronto" },
  { value: "America/Caracas",         label: "UTC−4  — Caracas, Halifax" },
  { value: "America/Sao_Paulo",       label: "UTC−3  — São Paulo, Buenos Aires" },
  { value: "Atlantic/South_Georgia",  label: "UTC−2  — South Georgia" },
  { value: "Atlantic/Azores",         label: "UTC−1  — Azores" },
  { value: "UTC",                     label: "UTC+0  — London, Dublin" },
  { value: "Europe/Paris",            label: "UTC+1  — Paris, Berlin, Rome" },
  { value: "Europe/Helsinki",         label: "UTC+2  — Helsinki, Cairo, Athens" },
  { value: "Europe/Moscow",           label: "UTC+3  — Moscow, Riyadh" },
  { value: "Asia/Dubai",              label: "UTC+4  — Dubai, Abu Dhabi" },
  { value: "Asia/Karachi",            label: "UTC+5  — Karachi, Islamabad" },
  { value: "Asia/Kolkata",            label: "UTC+5:30 — Mumbai, New Delhi" },
  { value: "Asia/Dhaka",              label: "UTC+6  — Dhaka, Almaty" },
  { value: "Asia/Bangkok",            label: "UTC+7  — Bangkok, Jakarta (WIB)" },
  { value: "Asia/Shanghai",           label: "UTC+8  — Shanghai, Singapore, KL" },
  { value: "Asia/Tokyo",              label: "UTC+9  — Tokyo, Seoul" },
  { value: "Australia/Sydney",        label: "UTC+10 — Sydney, Melbourne" },
  { value: "Pacific/Noumea",          label: "UTC+11 — Noumea, Solomon Is." },
  { value: "Pacific/Auckland",        label: "UTC+12 — Auckland, Fiji" },
  { value: "Pacific/Apia",            label: "UTC+13 — Apia, Tonga" },
  { value: "Pacific/Kiritimati",      label: "UTC+14 — Kiritimati" },
];

export default function TimezoneBar({ initialTimezone }: { initialTimezone: string }) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [time, setTime] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, startTransition] = useTransition();

  const tzRef = useRef(timezone);
  tzRef.current = timezone;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function tick() {
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: tzRef.current,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tz = e.target.value;
    setTimezone(tz);
    setIsOpen(false);
    startTransition(async () => {
      await updateTimezone(tz);
    });
  }

  const inList = TIMEZONES.some((t) => t.value === timezone);

  return (
    <>
      {/* Mobile: globe icon + dropdown panel */}
      <div className="relative sm:hidden" ref={panelRef}>
        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Change timezone"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-base">🌐</span>
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{time.slice(0, 5)}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 z-50 w-72">
            <p className="text-2xl font-mono font-bold text-gray-700 dark:text-gray-200 text-center mb-3">{time}</p>
            <select
              value={timezone}
              onChange={handleChange}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {!inList && <option value={timezone}>{timezone}</option>}
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Desktop: inline clock + selector */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-gray-400 dark:text-gray-500 text-sm font-mono">{time}</span>
        <select
          value={timezone}
          onChange={handleChange}
          className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 max-w-[210px]"
        >
          {!inList && <option value={timezone}>{timezone}</option>}
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}
