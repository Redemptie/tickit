"use client";

import { useState, useTransition } from "react";
import { searchUsers, sendFriendRequest, respondToRequest, removeFriend } from "./actions";

type IncomingRequest = {
  id: string;
  requester_id: string;
  username: string | null;
  display_name: string | null;
};

type Friend = {
  friendshipId: string;
  userId: string;
  username: string | null;
  display_name: string | null;
};

type LeaderboardEntry = {
  userId: string;
  username: string | null;
  display_name: string | null;
  total_points: number;
  current_streak: number;
  isMe: boolean;
};

type SearchResult = {
  id: string;
  username: string;
  display_name: string | null;
};

function getBadgeEmoji(points: number) {
  if (points >= 700) return "🏆";
  if (points >= 300) return "💪";
  if (points >= 100) return "⚡";
  return "🌱";
}

const rankStyles = [
  "text-yellow-500 font-extrabold",
  "text-gray-400 font-extrabold",
  "text-orange-400 font-extrabold",
];

export default function FriendsClient({
  incomingRequests: initialRequests,
  friends: initialFriends,
  leaderboard: initialLeaderboard,
}: {
  incomingRequests: IncomingRequest[];
  friends: Friend[];
  leaderboard: LeaderboardEntry[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState(initialRequests);
  const [friends, setFriends] = useState(initialFriends);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [isPending, startTransition] = useTransition();

  function showMessage(msg: string) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  }

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const { data, error } = await searchUsers(q);
    setResults(data);
    setSearchError(error);
  }

  function handleSendRequest(userId: string, username: string) {
    startTransition(async () => {
      const { error } = await sendFriendRequest(userId);
      if (error) {
        showMessage(error);
      } else {
        showMessage(`Friend request sent to @${username}!`);
        setResults((prev) => prev.filter((r) => r.id !== userId));
      }
    });
  }

  function handleRespond(friendshipId: string, accept: boolean, username: string) {
    startTransition(async () => {
      const { error } = await respondToRequest(friendshipId, accept);
      if (error) {
        showMessage(error);
      } else {
        setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
        if (accept) showMessage(`You and @${username} are now friends!`);
      }
    });
  }

  function handleRemove(friendshipId: string, userId: string, username: string) {
    startTransition(async () => {
      const { error } = await removeFriend(friendshipId);
      if (error) {
        showMessage(error);
      } else {
        setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
        setLeaderboard((prev) => prev.filter((e) => e.userId !== userId));
        showMessage(`Removed @${username} from friends.`);
      }
    });
  }

  const displayName = (f: { display_name: string | null; username: string | null }) =>
    f.display_name?.trim() || f.username || "Unknown";

  return (
    <div className="space-y-6">

      {/* Toast */}
      {actionMessage && (
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-sm font-semibold px-4 py-3 rounded-2xl">
          {actionMessage}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-3">
        <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">🏅 Leaderboard</h2>

        {leaderboard.length <= 1 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add friends to see how you stack up!
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((entry, i) => (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                  entry.isMe
                    ? "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                }`}
              >
                {/* Rank */}
                <span className={`w-6 text-center text-sm ${rankStyles[i] ?? "text-gray-400 font-semibold"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>

                {/* Badge emoji */}
                <span className="text-lg">{getBadgeEmoji(entry.total_points)}</span>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${entry.isMe ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-100"}`}>
                    {displayName(entry)}{entry.isMe && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full">You</span>}
                  </p>
                  {entry.username && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">@{entry.username}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  <div>
                    <p className="text-sm font-extrabold text-violet-600 dark:text-violet-400">{entry.total_points}</p>
                    <p className="text-[10px] text-gray-400">pts</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-orange-500">🔥{entry.current_streak}</p>
                    <p className="text-[10px] text-gray-400">streak</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-3">
        <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Add Friend</h2>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">@</span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by username…"
            className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
          />
        </div>

        {searchError && (
          <p className="text-sm text-red-500">{searchError}</p>
        )}

        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {r.display_name?.trim() || r.username}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">@{r.username}</p>
                </div>
                <button
                  onClick={() => handleSendRequest(r.id, r.username)}
                  disabled={isPending}
                  className="flex-shrink-0 text-xs font-bold bg-violet-600 hover:bg-violet-700 active:scale-95 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-all"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim().length >= 2 && results.length === 0 && !searchError && (
          <p className="text-sm text-gray-400 dark:text-gray-500">No users found.</p>
        )}
      </div>

      {/* Incoming requests */}
      {requests.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
            Friend Requests
            <span className="ml-2 text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </h2>
          <ul className="space-y-2">
            {requests.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {displayName(req)}
                  </p>
                  {req.username && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">@{req.username}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRespond(req.id, true, req.username ?? "user")}
                    disabled={isPending}
                    className="text-xs font-bold bg-green-500 hover:bg-green-600 active:scale-95 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, false, req.username ?? "user")}
                    disabled={isPending}
                    className="text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 active:scale-95 disabled:opacity-50 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Friends list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-3">
        <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
          My Friends
          {friends.length > 0 && (
            <span className="ml-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {friends.length}
            </span>
          )}
        </h2>

        {friends.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">👋</div>
            <p className="font-bold text-gray-600 dark:text-gray-300">No friends yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Search for a username above to send your first request!
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li
                key={f.friendshipId}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {displayName(f)}
                  </p>
                  {f.username && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">@{f.username}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(f.friendshipId, f.userId, f.username ?? "user")}
                  disabled={isPending}
                  className="flex-shrink-0 text-xs font-semibold text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 px-2 py-1.5 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
