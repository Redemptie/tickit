// Server Actions for tasks.
// Every action now returns { error: string | null } so the UI can show
// a message if something goes wrong instead of silently failing.

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTask(
  formData: FormData
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in to create a task." };

    const title = formData.get("title") as string;
    if (!title?.trim()) return { error: "Task title cannot be empty." };

    // Read the chosen points value from the form (default to 10 if missing)
    const rawPoints = parseInt(formData.get("points") as string, 10);
    const points = [5, 10, 20, 50].includes(rawPoints) ? rawPoints : 10;

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: title.trim(),
      points,
    });

    if (error) return { error: "Could not save the task. Please try again." };

    revalidatePath("/dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Toggle complete / incomplete ─────────────────────────────────────────────

export async function toggleTask(
  taskId: string,
  currentlyCompleted: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const nowCompleted = !currentlyCompleted;

    // Fetch the task's own points value before updating it
    const { data: taskData } = await supabase
      .from("tasks")
      .select("points")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    const taskPoints = taskData?.points ?? 10;

    const { error: taskError } = await supabase
      .from("tasks")
      .update({
        completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (taskError) return { error: "Could not update the task. Please try again." };

    // Fetch profile for points + streak
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points, current_streak, last_completed_date")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.total_points ?? 0;
    // Use the task's real points value, not a hardcoded 10
    const pointsChange = nowCompleted ? taskPoints : -taskPoints;
    const newPoints = Math.max(0, currentPoints + pointsChange);

    if (nowCompleted) {
      const today = new Date().toISOString().split("T")[0];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split("T")[0];

      const lastDate = profile?.last_completed_date ?? null;
      const currentStreak = profile?.current_streak ?? 0;

      let newStreak: number;
      if (!lastDate) {
        newStreak = 1;
      } else if (lastDate === today) {
        newStreak = currentStreak;
      } else if (lastDate === yesterday) {
        newStreak = currentStreak + 1;
      } else {
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
      await supabase
        .from("profiles")
        .update({ total_points: newPoints })
        .eq("id", user.id);
    }

    revalidatePath("/dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Edit title ───────────────────────────────────────────────────────────────

export async function updateTask(
  taskId: string,
  newTitle: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    if (!newTitle?.trim()) return { error: "Task title cannot be empty." };

    const { error } = await supabase
      .from("tasks")
      .update({ title: newTitle.trim() })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) return { error: "Could not update the task. Please try again." };

    revalidatePath("/dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTask(
  taskId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    // Read completed + points so we know how much to subtract if needed
    const { data: task } = await supabase
      .from("tasks")
      .select("completed, points")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) return { error: "Could not delete the task. Please try again." };

    // Subtract points if the deleted task was completed
    if (task?.completed) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", user.id)
        .single();

      const taskPoints = task?.points ?? 10;
    const newPoints = Math.max(0, (profile?.total_points ?? 0) - taskPoints);
      await supabase
        .from("profiles")
        .update({ total_points: newPoints })
        .eq("id", user.id);
    }

    revalidatePath("/dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
