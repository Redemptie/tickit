"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/tasks/actions";

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTask(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <div className="mb-6">
      <form ref={formRef} action={handleSubmit} className="flex gap-2">

        {/* Task title input */}
        <input
          name="title"
          type="text"
          required
          placeholder="Add a new task..."
          className={`flex-1 border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 text-sm transition-colors ${
            error ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-violet-400"
          }`}
        />

        {/* Points input — small number field, 1–50, defaults to 10 */}
        <input
          name="points"
          type="number"
          min="1"
          max="50"
          defaultValue={10}
          placeholder="10"
          className="w-16 border border-gray-200 rounded-xl px-2 py-3 text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
          title="Points (1–50)"
        />

        <button
          type="submit"
          disabled={isPending}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          {isPending ? "Adding..." : "+ Add Task"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
