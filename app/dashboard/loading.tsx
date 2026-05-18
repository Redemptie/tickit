// Next.js automatically shows this file while the dashboard page is loading.
// "animate-pulse" makes all the grey boxes gently fade in and out (skeleton effect).
// The layout matches the real dashboard so there's no jarring jump when it loads.

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-gray-50 animate-pulse">

      {/* ── Nav bar skeleton ── */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-gray-200 rounded-full" />
          <div className="h-5 w-16 bg-gray-200 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-36 bg-gray-200 rounded-lg hidden sm:block" />
          <div className="h-9 w-20 bg-gray-200 rounded-xl" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Greeting skeleton ── */}
        <div className="space-y-2">
          <div className="h-7 w-44 bg-gray-200 rounded-lg" />
          <div className="h-4 w-52 bg-gray-200 rounded-lg" />
        </div>

        {/* ── Stat cards skeleton ── */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-6 w-8 bg-gray-200 rounded-lg" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* ── Badge card skeleton ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-10 bg-gray-200 rounded" />
                <div className="h-5 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <div className="h-2.5 w-12 bg-gray-200 rounded ml-auto" />
              <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
              <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
            </div>
          </div>
          {/* Progress bar skeleton */}
          <div className="h-2.5 w-full bg-gray-200 rounded-full" />
          <div className="h-2.5 w-16 bg-gray-200 rounded ml-auto" />
        </div>

        {/* ── Task section skeleton ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 bg-gray-200 rounded-lg" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>

          {/* Add task input skeleton */}
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 w-28 bg-gray-200 rounded-xl" />
          </div>

          {/* Task rows skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <div className="h-6 w-6 bg-gray-200 rounded-full flex-shrink-0" />
              {/* Title bar — each row slightly different width so it looks natural */}
              <div
                className="h-4 bg-gray-200 rounded-lg flex-1"
                style={{ maxWidth: `${65 + i * 10}%` }}
              />
              <div className="h-5 w-10 bg-gray-200 rounded-full" />
              <div className="h-6 w-6 bg-gray-200 rounded-lg" />
              <div className="h-6 w-6 bg-gray-200 rounded-lg" />
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}
