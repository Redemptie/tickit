// Dashboard — only accessible to logged-in users.
// Server Component: all data is fetched before the page renders.

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import TaskForm from "@/app/dashboard/TaskForm";
import TaskItem from "@/app/dashboard/TaskItem";
import NavMenu from "@/app/dashboard/NavMenu";
import VacationToggle from "@/app/dashboard/VacationToggle";
import GreetingEditor from "@/app/dashboard/GreetingEditor";
import ClientAuthRedirect from "@/app/dashboard/ClientAuthRedirect";

// --- Badge helpers ---

function getBadge(points: number) {
  if (points >= 700) return { label: "Legend",     emoji: "🏆", color: "text-yellow-500", bg: "bg-yellow-50",  border: "border-yellow-200", bar: "bg-yellow-400", next: null,        nextAt: null, prevAt: 700 };
  if (points >= 300) return { label: "Grinder",    emoji: "💪", color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200", bar: "bg-purple-500", next: "Legend",    nextAt: 700,  prevAt: 300 };
  if (points >= 100) return { label: "Productive", emoji: "⚡", color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   bar: "bg-blue-500",   next: "Grinder",   nextAt: 300,  prevAt: 100 };
  return               { label: "Beginner",    emoji: "🌱", color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200",  bar: "bg-green-500",  next: "Productive", nextAt: 100,  prevAt: 0   };
}

function getBadgeProgress(points: number) {
  if (points >= 700) return 100;
  if (points >= 300) return Math.round(((points - 300) / 400) * 100);
  if (points >= 100) return Math.round(((points - 100) / 200) * 100);
  return Math.round((points / 100) * 100);
}

// --- Page ---

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ClientAuthRedirect />;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points, current_streak, last_completed_date, timezone, last_reset_date, vacation_mode, display_name")
    .eq("id", user.id)
    .single();

  // Timezone helpers (needed before task fetch so reset uses correct local date)
  const tz = profile?.timezone ?? "UTC";
  const localDate = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  const now = new Date();
  const todayLocal = localDate(now);

  // Daily reset — if the last reset wasn't today, uncheck all completed tasks
  if (profile && (profile.last_reset_date ?? "").slice(0, 10) !== todayLocal) {
    await supabase
      .from("tasks")
      .update({ completed: false, completed_at: null })
      .eq("user_id", user.id)
      .eq("completed", true);

    await supabase
      .from("profiles")
      .update({ last_reset_date: todayLocal })
      .eq("id", user.id);
  }

  // Fetch tasks after potential reset — incomplete first, then complete; newest first within each group
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, completed, points, category, created_at")
    .eq("user_id", user.id)
    .order("completed",   { ascending: true  })
    .order("created_at",  { ascending: false });

  const totalPoints    = profile?.total_points   ?? 0;
  const currentStreak  = profile?.current_streak ?? 0;
  const completedCount = tasks?.filter((t) => t.completed).length ?? 0;
  const totalCount     = tasks?.length ?? 0;

  const earnedToday   = tasks?.filter((t) => t.completed).reduce((s, t) => s + t.points, 0) ?? 0;
  const possibleToday = tasks?.reduce((s, t) => s + t.points, 0) ?? 0;
  const dailyPercent  = possibleToday > 0 ? Math.round((earnedToday / possibleToday) * 100) : 0;
  const circColor     = dailyPercent <= 30 ? "#ef4444"
                      : dailyPercent <= 50 ? "#f97316"
                      : dailyPercent <= 64 ? "#eab308"
                      :                      "#22c55e";
  const circTextColor = dailyPercent <= 30 ? "text-red-500"
                      : dailyPercent <= 50 ? "text-orange-500"
                      : dailyPercent <= 64 ? "text-yellow-500"
                      :                      "text-green-500";
  const circR         = 18;
  const circC         = 2 * Math.PI * circR;
  const circOffset    = circC * (1 - Math.min(dailyPercent, 100) / 100);

  // At-risk = last completion was exactly on the final grace day (next miss resets streak)
  const graceDays      = currentStreak >= 20 ? 2 : currentStreak >= 10 ? 1 : 0;
  const lastGraceDay   = new Date(now);
  lastGraceDay.setDate(lastGraceDay.getDate() - (graceDays + 1));
  const streakAtRisk   =
    currentStreak > 0 &&
    profile?.last_completed_date === localDate(lastGraceDay);

  const vacationMode   = profile?.vacation_mode ?? false;
  const greetingName   = profile?.display_name?.trim() || user.email?.split("@")[0] || "there";

  const badge    = getBadge(totalPoints);
  const progress = getBadgeProgress(totalPoints);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Nav bar ── */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-base leading-none">✅</span>
          </div>
          <span className="text-lg font-extrabold text-violet-600">TickIt</span>
        </div>
        <NavMenu email={user.email!} timezone={tz} />
      </nav>

      {/* ── Page content ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* Greeting */}
        <div>
          <GreetingEditor name={greetingName} />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{user.email}</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-violet-50 dark:bg-violet-950/20 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/40 p-4 text-center">
            <div className="text-3xl mb-1.5">⭐</div>
            <div className="text-2xl font-extrabold text-violet-600 leading-none">{totalPoints}</div>
            <div className="text-violet-400 dark:text-violet-500 text-xs mt-1.5 font-medium">Points</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/40 p-4 text-center">
            <div className="text-3xl mb-1.5">🔥</div>
            <div className="text-2xl font-extrabold text-orange-500 leading-none">{currentStreak}</div>
            <div className="text-orange-400 dark:text-orange-500 text-xs mt-1.5 font-medium">Streak</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/40 p-4 text-center">
            <div className="text-3xl mb-1.5">✅</div>
            <div className="text-2xl font-extrabold text-green-500 leading-none">{completedCount}</div>
            <div className="text-green-500 dark:text-green-600 text-xs mt-1.5 font-medium">Done</div>
          </div>

          {/* Daily goal circle */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex flex-col items-center justify-center">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r={circR} fill="none" strokeWidth="6" className="stroke-gray-200 dark:stroke-gray-700" />
                <circle
                  cx="24" cy="24" r={circR}
                  fill="none"
                  stroke={circColor}
                  strokeWidth="6"
                  strokeDasharray={circC}
                  strokeDashoffset={circOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.4s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-gray-800 dark:text-gray-100">
                {dailyPercent}%
              </span>
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-xs mt-1.5 font-medium">Daily goal</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${circTextColor}`}>
              {dailyPercent >= 65 ? "Streak safe!" : "Keep going!"}
            </div>
          </div>
        </div>

        {/* ── Badge card ── */}
        <div className={`${badge.bg} dark:bg-gray-900 border ${badge.border} dark:border-gray-800 rounded-2xl shadow-sm p-5`}>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{badge.emoji}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Badge</p>
                <p className={`text-lg font-extrabold leading-tight ${badge.color}`}>{badge.label}</p>
              </div>
            </div>
            {badge.next ? (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Next up</p>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{badge.next}</p>
                <p className="text-xs text-gray-400">{badge.nextAt! - totalPoints} pts to go</p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-sm font-bold text-yellow-500">Max level!</p>
                <p className="text-xs text-gray-400">You&apos;re a Legend 🎉</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/60 dark:bg-black/20 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${badge.bar}`}
              style={{ width: progress > 0 ? `max(${progress}%, 8px)` : "0%" }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {badge.next ? `${badge.nextAt! - totalPoints} pts to ${badge.next}` : "Max level reached!"}
            </p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{progress}%</p>
          </div>
        </div>

        {/* ── Streak warning ── */}
        {streakAtRisk && !vacationMode && (
          <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl px-5 py-4">
            <span className="text-2xl">🔥</span>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Your {currentStreak}-day streak resets tonight — complete a task to keep it alive!
            </p>
          </div>
        )}

        {/* ── Vacation mode banner ── */}
        {vacationMode && (
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl px-5 py-4">
            <span className="text-2xl">🏖️</span>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Vacation Mode ON — points and streak paused
            </p>
          </div>
        )}

        {/* ── Task section ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">

          {/* Header with task count + vacation toggle */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">My Tasks</h2>
            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {completedCount} / {totalCount} done
                </span>
              )}
              <VacationToggle isOn={vacationMode} />
            </div>
          </div>

          {/* Add task form */}
          <TaskForm />

          {/* Task list or empty state */}
          {totalCount === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-bold text-gray-600 dark:text-gray-300">No tasks yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5">
                Add your first one above to start earning points!
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {(tasks ?? []).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
          )}

        </div>
      </div>
    </main>
  );
}
