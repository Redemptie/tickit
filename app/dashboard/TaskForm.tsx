"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/tasks/actions";

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  // Holds any error message returned by the server action
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null); // clear previous error before trying again
    startTransition(async () => {
      const result = await createTask(formData);
      if (result.error) {
        // Server action failed — show the message to the user
        setError(result.error);
      } else {
        // Success — clear the input
        formRef.current?.reset();
      }
    });
  }

  return (
    // Wrap in a div so the error message sits neatly below the form row
    <div className="mb-6">
      <form ref={formRef} action={handleSubmit} className="flex gap-3">
        <input
          name="title"
          type="text"
          required
          placeholder="Add a new task..."
          className={`flex-1 border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 text-sm transition-colors ${
            error
              ? "border-red-300 focus:ring-red-300"   // red border when there's an error
              : "border-gray-200 focus:ring-violet-400"
          }`}
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          {isPending ? "Adding..." : "+ Add Task"}
        </button>
      </form>

      {/* Error message — only shown when error is not null */}
      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
