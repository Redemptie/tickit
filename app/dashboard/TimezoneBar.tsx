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
  const [, startTransition] = useTransition();

  // Ref always holds the latest timezone so the interval never needs to restart
  const tzRef = useRef(timezone);
  tzRef.current = timezone;

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
  }, []); // runs once; timezone changes are picked up via tzRef

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tz = e.target.value;
    setTimezone(tz);          // updates tzRef.current on next render
    startTransition(async () => {
      await updateTimezone(tz);
    });
  }

  const inList = TIMEZONES.some((t) => t.value === timezone);

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="text-gray-400 text-sm font-mono">{time}</span>
      <select
        value={timezone}
        onChange={handleChange}
        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white max-w-[210px]"
      >
        {!inList && <option value={timezone}>{timezone}</option>}
        {TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>{tz.label}</option>
        ))}
      </select>
    </div>
  );
}
