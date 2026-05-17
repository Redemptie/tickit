// Server Actions for tasks.
// These run on the server, so they can safely talk to Supabase.

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Creates a new task for the logged-in user
export async function createTask(formData: FormData) {
  const supabase = await createClient();

  // Make sure someone is actually logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const title = formData.get("title") as string;

  // Don't create a task if the title is blank
  if (!title?.trim()) return;

  await supabase.from("tasks").insert({
    user_id: user.id,
    title: title.trim(),
  });

  // Tell Next.js to refresh the dashboard so the new task shows up
  revalidatePath("/dashboard");
}

// Toggles a task between complete and incomplete, and updates points + streak
export async function toggleTask(taskId: string, currentlyCompleted: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const nowCompleted = !currentlyCompleted;

  // Update the task row
  await supabase
    .from("tasks")
    .update({
      completed: nowCompleted,
      completed_at: nowCompleted ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  // Fetch the full profile — we need points, streak, and last completed date
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points, current_streak, last_completed_date")
    .eq("id", user.id)
    .single();

  const currentPoints = profile?.total_points ?? 0;
  const pointsChange = nowCompleted ? 10 : -10;
  const newPoints = Math.max(0, currentPoints + pointsChange);

  if (nowCompleted) {
    // --- Streak logic ---
    // Today's date as a plain string: "2026-05-17"
    const today = new Date().toISOString().split("T")[0];

    // Yesterday's date as a plain string
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];

    const lastDate = profile?.last_completed_date ?? null;
    const currentStreak = profile?.current_streak ?? 0;

    let newStreak: number;
    if (!lastDate) {
      // Very first completion ever
      newStreak = 1;
    } else if (lastDate === today) {
      // Already completed a task today — streak stays the same
      newStreak = currentStreak;
    } else if (lastDate === yesterday) {
      // Completed something yesterday — extend the streak!
      newStreak = currentStreak + 1;
    } else {
      // Missed at least one day — streak resets to 1
      newStreak = 1;
    }

    await supabase
      .from("profiles")
      .update({
        total_points: newPoints,
        current_streak: newStreak,
        last_completed_date: today,
      })
      .eq("id", user.id);
  } else {
    // When un-completing, only adjust points — don't touch the streak
    await supabase
      .from("profiles")
      .update({ total_points: newPoints })
      .eq("id", user.id);
  }

  revalidatePath("/dashboard");
}

// Updates the title of a task the user owns
export async function updateTask(taskId: string, newTitle: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Don't save a blank title
  if (!newTitle?.trim()) return;

  await supabase
    .from("tasks")
    .update({ title: newTitle.trim() })
    .eq("id", taskId)
    .eq("user_id", user.id); // security: only update own tasks

  revalidatePath("/dashboard");
}

// Deletes a task the user owns.
// If the task was completed, also subtract its 10 points from the profile.
export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Read the task first so we know whether it was completed
  const { data: task } = await supabase
    .from("tasks")
    .select("completed")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  // Delete the task
  await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  // If the task was completed, subtract its points from the profile
  if (task?.completed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", user.id)
      .single();

    const newPoints = Math.max(0, (profile?.total_points ?? 0) - 10);
    await supabase
      .from("profiles")
      .update({ total_points: newPoints })
      .eq("id", user.id);
  }

  revalidatePath("/dashboard");
}
