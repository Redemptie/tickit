// Dashboard — only accessible to logged-in users.
// Server Component: all data is fetched before the page renders.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import TaskForm from "@/app/dashboard/TaskForm";
import TaskItem from "@/app/dashboard/TaskItem";

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
  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points, current_streak, last_completed_date")
    .eq("id", user.id)
    .single();

  // Fetch tasks — incomplete first, then complete; within each group newest first
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, completed, points, created_at")
    .eq("user_id", user.id)
    .order("completed",   { ascending: true  })
    .order("created_at",  { ascending: false });

  const totalPoints    = profile?.total_points   ?? 0;
  const currentStreak  = profile?.current_streak ?? 0;
  const completedCount = tasks?.filter((t) => t.completed).length ?? 0;
  const totalCount     = tasks?.length ?? 0;

  const badge    = getBadge(totalPoints);
  const progress = getBadgeProgress(totalPoints);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Nav bar ── */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span className="text-xl font-extrabold text-violet-600">TickIt</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:block truncate max-w-[160px]">
            {user.email}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Log Out
            </button>
          </form>
        </div>
      </nav>

      {/* ── Page content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Hey there! 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xl font-extrabold text-violet-600 leading-none">{totalPoints}</div>
            <div className="text-gray-400 text-xs mt-1">Points</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-extrabold text-orange-500 leading-none">{currentStreak}</div>
            <div className="text-gray-400 text-xs mt-1">Streak</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-xl font-extrabold text-green-500 leading-none">{completedCount}</div>
            <div className="text-gray-400 text-xs mt-1">Done</div>
          </div>
        </div>

        {/* ── Badge card ── */}
        <div className={`${badge.bg} border ${badge.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
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
                <p className="text-sm font-bold text-gray-600">{badge.next}</p>
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
          <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${badge.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">{progress}% to next level</p>
        </div>

        {/* ── Task section ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Header with task count */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-700">My Tasks</h2>
            {totalCount > 0 && (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {completedCount} / {totalCount} done
              </span>
            )}
          </div>

          {/* Add task form */}
          <TaskForm />

          {/* Task list or empty state */}
          {totalCount === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <div className="text-5xl mb-3">📝</div>
              <p className="font-semibold text-gray-500">No tasks yet!</p>
              <p className="text-sm mt-1">Add your first task above to get started.</p>
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
