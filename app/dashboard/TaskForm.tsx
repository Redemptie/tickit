"use client";

// TaskForm is a client component because it needs to:
// 1. Clear the input after the task is submitted
// 2. Show a loading state while the server action runs

import { useRef, useTransition } from "react";
import { createTask } from "@/app/tasks/actions";

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);

  // useTransition lets us know when the server action is still running
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createTask(formData);
      // Clear the input field after the task is saved
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-3 mb-6">
      <input
        name="title"
        type="text"
        required
        placeholder="Add a new task..."
        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
      >
        {isPending ? "Adding..." : "+ Add Task"}
      </button>
    </form>
  );
}
