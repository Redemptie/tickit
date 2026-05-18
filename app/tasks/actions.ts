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

    // Read and validate points (1–50, default 10)
    const rawPoints = parseInt(formData.get("points") as string, 10);
    const points = !isNaN(rawPoints) && rawPoints >= 1 && rawPoints <= 50 ? rawPoints : 10;

    // Read and validate category
    const VALID_CATEGORIES = ["Work", "School", "Health", "Personal", "Other"];
    const rawCategory = formData.get("category") as string;
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "Other";

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: title.trim(),
      points,
      category,
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

    // Fetch task and profile in parallel — need vacation_mode before writing completed_in_vacation
    const [{ data: taskData }, { data: profile }] = await Promise.all([
      supabase.from("tasks").select("points, completed_in_vacation").eq("id", taskId).eq("user_id", user.id).single(),
      supabase.from("profiles").select("total_points, current_streak, last_completed_date, timezone, vacation_mode").eq("id", user.id).single(),
    ]);

    const taskPoints = taskData?.points ?? 10;
    const wasCompletedInVacation = taskData?.completed_in_vacation ?? false;
    const vacationMode = profile?.vacation_mode ?? false;

    const { error: taskError } = await supabase
      .from("tasks")
      .update({
        completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
        completed_in_vacation: nowCompleted ? vacationMode : false,
      })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (taskError) return { error: "Could not update the task. Please try again." };

    // Award points when completing (vacation off); deduct only if points were originally awarded
    const shouldAdjustPoints = nowCompleted ? !vacationMode : !wasCompletedInVacation;

    if (shouldAdjustPoints) {
      const currentPoints = profile?.total_points ?? 0;
      const pointsChange = nowCompleted ? taskPoints : -taskPoints;
      const newPoints = Math.max(0, currentPoints + pointsChange);

      if (nowCompleted) {
        const tz = profile?.timezone ?? "UTC";
        const toLocal = (d: Date) =>
          new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
        const now = new Date();
        const today = toLocal(now);
        const daysAgo = (n: number) => {
          const d = new Date(now);
          d.setDate(d.getDate() - n);
          return toLocal(d);
        };

        const lastDate = profile?.last_completed_date ?? null;
        const currentStreak = profile?.current_streak ?? 0;
        const graceDays = currentStreak >= 20 ? 2 : currentStreak >= 10 ? 1 : 0;

        let newStreak: number;
        if (!lastDate) {
          newStreak = 1;
        } else if (lastDate === today) {
          newStreak = currentStreak;
        } else if (lastDate === daysAgo(1)) {
          newStreak = currentStreak + 1;
        } else {
          const inGrace = Array.from({ length: graceDays }, (_, i) => daysAgo(i + 2))
            .includes(lastDate);
          newStreak = inGrace ? currentStreak : 1;
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
  newTitle: string,
  newPoints: number
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    if (!newTitle?.trim()) return { error: "Task title cannot be empty." };

    // Clamp points to valid range
    const clampedPoints = !isNaN(newPoints) && newPoints >= 1 && newPoints <= 50
      ? Math.round(newPoints)
      : 10;

    // Read the current task so we know the old points and whether it's completed
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("completed, points, completed_in_vacation")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("tasks")
      .update({ title: newTitle.trim(), points: clampedPoints })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) return { error: "Could not update the task. Please try again." };

    // If the task was completed and points were awarded, adjust the profile total by the difference
    if (currentTask?.completed && !currentTask?.completed_in_vacation) {
      const oldPoints = currentTask.points ?? 10;
      const diff = clampedPoints - oldPoints;

      if (diff !== 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", user.id)
          .single();

        const newTotal = Math.max(0, (profile?.total_points ?? 0) + diff);
        await supabase
          .from("profiles")
          .update({ total_points: newTotal })
          .eq("id", user.id);
      }
    }

    revalidatePath("/dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Update timezone ─────────────────────────────────────────────────────────

export async function updateTimezone(
  timezone: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const { error } = await supabase
      .from("profiles")
      .update({ timezone })
      .eq("id", user.id);

    if (error) return { error: "Could not save timezone." };
    return { error: null };
  } catch {
    return { error: "Something went wrong." };
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
      .select("completed, points, completed_in_vacation")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) return { error: "Could not delete the task. Please try again." };

    // Subtract points only if the task was completed and points were originally awarded
    if (task?.completed && !task?.completed_in_vacation) {
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

// ─── Display name ────────────────────────────────────────────────────────────

export async function updateDisplayName(
  name: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const sanitized = name.trim().slice(0, 30) || null;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: sanitized })
      .eq("id", user.id);

    if (error) return { error: "Could not update display name." };
    revalidatePath("/dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong." };
  }
}

// ─── Vacation mode ────────────────────────────────────────────────────────────

export async function setVacationMode(
  enabled: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const { error } = await supabase
      .from("profiles")
      .update({ vacation_mode: enabled })
      .eq("id", user.id);

    if (error) return { error: "Could not update vacation mode." };

    revalidatePath("/dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong." };
  }
}
