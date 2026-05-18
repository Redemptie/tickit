export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import FriendsClient from "./FriendsClient";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Incoming pending requests (others requested me)
  const { data: incoming } = await supabase
    .from("friendships")
    .select("id, requester_id, profiles!friendships_requester_id_fkey(username, display_name)")
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  // Accepted friends — grab both directions
  const [{ data: sentFriends }, { data: receivedFriends }] = await Promise.all([
    supabase
      .from("friendships")
      .select("id, addressee_id, profiles!friendships_addressee_id_fkey(username, display_name)")
      .eq("requester_id", user.id)
      .eq("status", "accepted"),
    supabase
      .from("friendships")
      .select("id, requester_id, profiles!friendships_requester_id_fkey(username, display_name)")
      .eq("addressee_id", user.id)
      .eq("status", "accepted"),
  ]);

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

  const incomingRequests: IncomingRequest[] = (incoming ?? []).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      requester_id: r.requester_id,
      username: (p as { username?: string | null })?.username ?? null,
      display_name: (p as { display_name?: string | null })?.display_name ?? null,
    };
  });

  const friends: Friend[] = [
    ...(sentFriends ?? []).map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        friendshipId: r.id,
        userId: r.addressee_id,
        username: (p as { username?: string | null })?.username ?? null,
        display_name: (p as { display_name?: string | null })?.display_name ?? null,
      };
    }),
    ...(receivedFriends ?? []).map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        friendshipId: r.id,
        userId: r.requester_id,
        username: (p as { username?: string | null })?.username ?? null,
        display_name: (p as { display_name?: string | null })?.display_name ?? null,
      };
    }),
  ];

  // Leaderboard: my profile + all accepted friends' profiles
  const friendUserIds = friends.map((f) => f.userId);

  const [{ data: myProfile }, { data: friendProfiles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, total_points, current_streak")
      .eq("id", user.id)
      .single(),
    friendUserIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, display_name, total_points, current_streak")
          .in("id", friendUserIds)
      : Promise.resolve({ data: [] as { id: string; username: string | null; display_name: string | null; total_points: number; current_streak: number }[] }),
  ]);

  type LeaderboardEntry = {
    userId: string;
    username: string | null;
    display_name: string | null;
    total_points: number;
    current_streak: number;
    isMe: boolean;
  };

  const leaderboard: LeaderboardEntry[] = [
    {
      userId: user.id,
      username: myProfile?.username ?? null,
      display_name: myProfile?.display_name ?? null,
      total_points: myProfile?.total_points ?? 0,
      current_streak: myProfile?.current_streak ?? 0,
      isMe: true,
    },
    ...(friendProfiles ?? []).map((p) => ({
      userId: p.id,
      username: p.username ?? null,
      display_name: p.display_name ?? null,
      total_points: p.total_points ?? 0,
      current_streak: p.current_streak ?? 0,
      isMe: false,
    })),
  ].sort((a, b) => b.total_points - a.total_points);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-base leading-none">✅</span>
          </div>
          <span className="text-lg font-extrabold text-violet-600">TickIt</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">Friends</h1>
        <FriendsClient
          incomingRequests={incomingRequests}
          friends={friends}
          leaderboard={leaderboard}
        />
      </div>
    </main>
  );
}
