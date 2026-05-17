import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">

        {/* App icon + name */}
        <div className="text-6xl mb-3">✅</div>
        <h1 className="text-4xl font-extrabold text-violet-600 mb-1">TickIt</h1>
        <p className="text-gray-500 text-lg font-medium mb-2">
          Check it. Earn it. Level up.
        </p>
        <p className="text-gray-400 text-sm mb-7">
          The to-do app that actually makes you want to get things done.
        </p>

        {/* Feature highlights */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left space-y-3">
          {[
            ["✅", "Create unlimited tasks"],
            ["⭐", "Earn 10 points per completed task"],
            ["🔥", "Build daily streaks"],
            ["🏆", "Unlock badges: Beginner → Legend"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold py-3 rounded-xl transition-all"
          >
            Sign Up — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="border-2 border-violet-600 text-violet-600 hover:bg-violet-50 active:scale-95 font-bold py-3 rounded-xl transition-all"
          >
            Log In
          </Link>
        </div>

        <p className="text-gray-300 text-xs mt-6">No ads. No spam. Just productivity. 🚀</p>
      </div>
    </main>
  );
}
