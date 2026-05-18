"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type UserResult = { id: string; username: string; display_name: string | null };

export async function searchUsers(
  query: string
): Promise<{ data: UserResult[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "You must be logged in." };

    const trimmed = query.trim();
    if (trimmed.length < 2) return { data: [], error: null };

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .ilike("username", `${trimmed}%`)
      .neq("id", user.id)
      .not("username", "is", null)
      .limit(8);

    if (error) return { data: [], error: "Search failed." };
    return { data: (data ?? []) as UserResult[], error: null };
  } catch {
    return { data: [], error: "Something went wrong." };
  }
}

export async function sendFriendRequest(
  addresseeId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    // Check both directions for existing friendship
    const [{ data: fwd }, { data: rev }] = await Promise.all([
      supabase.from("friendships").select("id, status").eq("requester_id", user.id).eq("addressee_id", addresseeId).maybeSingle(),
      supabase.from("friendships").select("id, status").eq("requester_id", addresseeId).eq("addressee_id", user.id).maybeSingle(),
    ]);
    const existing = fwd ?? rev;
    if (existing) {
      if (existing.status === "accepted") return { error: "You are already friends." };
      if (existing.status === "pending")  return { error: "A friend request is already pending." };
    }

    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: addresseeId });

    if (error) return { error: "Could not send friend request." };
    revalidatePath("/friends");
    return { error: null };
  } catch {
    return { error: "Something went wrong." };
  }
}

export async function respondToRequest(
  friendshipId: string,
  accept: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    if (accept) {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId)
        .eq("addressee_id", user.id);
      if (error) return { error: "Could not accept request." };
    } else {
      // Decline = delete so the person can re-request later
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId)
        .eq("addressee_id", user.id);
      if (error) return { error: "Could not decline request." };
    }

    revalidatePath("/friends");
    return { error: null };
  } catch {
    return { error: "Something went wrong." };
  }
}

export async function removeFriend(
  friendshipId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) return { error: "Could not remove friend." };
    revalidatePath("/friends");
    return { error: null };
  } catch {
    return { error: "Something went wrong." };
  }
}
