export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// ── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY_FULL  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const WEEKDAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Parse "YYYY-MM-DD" safely without Date timezone issues
function parseYMD(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m, day: d };
}
function fmtShort(dateStr: string) {
  const { month, day } = parseYMD(dateStr);
  return `${MONTHS_SHORT[month - 1]} ${day}`;
}
function fmtLong(dateStr: string) {
  const { year, month, day } = parseYMD(dateStr);
  return `${MONTHS_FULL[month - 1]} ${day}, ${year}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type DayData = {
  date: string;
  dayFull: string;
  dayShort: string;
  status: "past" | "today" | "future";
  percentage: number;
  pointsEarned: number;
  tasksCompleted: number;
  totalPossible: number;
  hasData: boolean;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const tz  = profile?.timezone ?? "UTC";
  const now = new Date();

  // Today's date string in user's timezone (e.g. "2026-05-19")
  const todayStr     = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  const todayWeekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(now);
  const todayIndex   = WEEKDAY_FULL.indexOf(todayWeekday); // 0 = Mon, 6 = Sun

  // Build week date strings — Monday first
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + (i - todayIndex));
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  });

  // ── Fetch today's tasks ──
  const { data: todayTasks } = await supabase
    .from("tasks")
    .select("completed, points")
    .eq("user_id", user.id);

  const todayPts    = todayTasks?.filter(t => t.completed).reduce((s, t) => s + t.points, 0) ?? 0;
  const todayDone   = todayTasks?.filter(t => t.completed).length ?? 0;
  const todayTotal  = todayTasks?.reduce((s, t) => s + t.points, 0) ?? 0;
  const todayPct    = todayTotal > 0 ? Math.round((todayPts / todayTotal) * 100) : 0;

  // ── Fetch past days from daily_history (table may not exist yet — handled gracefully) ──
  const pastDates = weekDates.filter(d => d < todayStr);
  type HistoryEntry = { percentage: number; pointsEarned: number; tasksCompleted: number; totalPossible: number };
  const historyMap: Record<string, HistoryEntry> = {};

  if (pastDates.length > 0) {
    const { data: history } = await supabase
      .from("daily_history")
      .select("date, points_earned, tasks_completed, total_possible_points, percentage")
      .eq("user_id", user.id)
      .in("date", pastDates);

    (history ?? []).forEach(h => {
      historyMap[h.date] = {
        percentage:    h.percentage,
        pointsEarned:  h.points_earned,
        tasksCompleted: h.tasks_completed,
        totalPossible: h.total_possible_points,
      };
    });
  }

  // ── Build day objects ──
  const days: DayData[] = weekDates.map((date, i) => {
    const status = date < todayStr ? "past" : date === todayStr ? "today" : "future";

    if (status === "today") {
      return { date, dayFull: WEEKDAY_FULL[i], dayShort: WEEKDAY_SHORT[i], status,
        percentage: todayPct, pointsEarned: todayPts, tasksCompleted: todayDone,
        totalPossible: todayTotal, hasData: todayTotal > 0 };
    }
    if (status === "past") {
      const h = historyMap[date];
      return { date, dayFull: WEEKDAY_FULL[i], dayShort: WEEKDAY_SHORT[i], status,
        percentage: h?.percentage ?? 0, pointsEarned: h?.pointsEarned ?? 0,
        tasksCompleted: h?.tasksCompleted ?? 0, totalPossible: h?.totalPossible ?? 0,
        hasData: !!h };
    }
    return { date, dayFull: WEEKDAY_FULL[i], dayShort: WEEKDAY_SHORT[i], status: "future",
      percentage: 0, pointsEarned: 0, tasksCompleted: 0, totalPossible: 0, hasData: false };
  });

  // ── Week summary ──
  const daysWithData      = days.filter(d => d.status !== "future" && d.hasData);
  const weekPtsTotal      = days.reduce((s, d) => s + d.pointsEarned, 0);
  const weekDoneTotal     = days.reduce((s, d) => s + d.tasksCompleted, 0);
  const avgPct            = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.percentage, 0) / daysWithData.length)
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Nav ── */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-base leading-none">✅</span>
          </div>
          <span className="text-lg font-extrabold text-violet-600">TickIt</span>
        </Link>
        <Link href="/dashboard"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">Weekly Progress</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {fmtShort(weekDates[0])} — {fmtLong(weekDates[6])}
          </p>
        </div>

        {/* ── Day cards ── */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="grid grid-cols-7 gap-2 min-w-[420px]">
            {days.map(day => {
              let card    = "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800";
              let pctCls  = "text-gray-300 dark:text-gray-600";
              let labelCls = "text-gray-400 dark:text-gray-500";

              if (day.status === "today") {
                card    = "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 ring-2 ring-violet-400 dark:ring-violet-600";
                pctCls  = "text-violet-600 dark:text-violet-400";
                labelCls = "text-violet-500 dark:text-violet-400";
              } else if (day.status === "past" && day.hasData) {
                if (day.percentage >= 65) {
                  card    = "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
                  pctCls  = "text-green-600 dark:text-green-400";
                  labelCls = "text-green-500 dark:text-green-500";
                } else {
                  card    = "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
                  pctCls  = "text-red-500 dark:text-red-400";
                  labelCls = "text-red-400 dark:text-red-500";
                }
              }

              return (
                <div key={day.date}
                  className={`rounded-xl border p-2 flex flex-col items-center text-center min-h-[90px] justify-between transition-all ${card} ${day.status === "future" ? "opacity-40" : ""}`}
                >
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${labelCls}`}>
                      {day.dayShort}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {fmtShort(day.date).split(" ")[1]}
                    </p>
                  </div>

                  <div className="my-1">
                    {day.status === "future" || (!day.hasData && day.status === "past") ? (
                      <span className="text-base font-bold text-gray-200 dark:text-gray-700">—</span>
                    ) : (
                      <span className={`text-xl font-extrabold leading-none ${pctCls}`}>
                        {day.percentage}%
                      </span>
                    )}
                  </div>

                  <div className="h-3 flex items-center justify-center">
                    {day.status === "today" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    )}
                    {day.status === "past" && day.hasData && day.percentage >= 65 && (
                      <span className="text-[10px] text-green-500">✓</span>
                    )}
                    {day.status === "past" && day.hasData && day.percentage < 65 && (
                      <span className="text-[10px] text-red-400">✗</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Color legend ── */}
        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-violet-200 dark:bg-violet-800 inline-block" />Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800 inline-block" />≥ 65% complete
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-800 inline-block" />&lt; 65% complete
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700 inline-block" />Future / no data
          </span>
        </div>

        {/* ── Week summary ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">This Week</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-violet-600">{avgPct}%</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">Avg daily</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-orange-500">{weekPtsTotal}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">Points earned</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-green-500">{weekDoneTotal}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">Tasks done</p>
            </div>
          </div>
        </div>

        {/* ── Empty note ── */}
        {daysWithData.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 pb-4">
            Complete tasks to start seeing your weekly history.
          </p>
        )}

      </div>
    </main>
  );
}
