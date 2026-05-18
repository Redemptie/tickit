"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/tasks/actions";

// The four point options the user can pick from
const POINT_OPTIONS = [5, 10, 20, 50];

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Default to 10 points — user can change it before submitting
  const [selectedPoints, setSelectedPoints] = useState(10);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTask(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setSelectedPoints(10); // reset points back to default after saving
      }
    });
  }

  return (
    <div className="mb-6">
      <form ref={formRef} action={handleSubmit}>

        {/* Points selector — row of pill buttons */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 font-medium">Points:</span>
          {POINT_OPTIONS.map((pts) => (
            <button
              key={pts}
              type="button" // important: "button" so it doesn't submit the form
              onClick={() => setSelectedPoints(pts)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                selectedPoints === pts
                  ? "bg-violet-600 text-white"                          // selected
                  : "bg-gray-100 text-gray-500 hover:bg-violet-100 hover:text-violet-600" // unselected
              }`}
            >
              {pts} pts
            </button>
          ))}
        </div>

        {/* Hidden input carries the selected points into the form data */}
        <input type="hidden" name="points" value={selectedPoints} />

        {/* Task input + submit button */}
        <div className="flex gap-3">
          <input
            name="title"
            type="text"
            required
            placeholder="Add a new task..."
            className={`flex-1 border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 text-sm transition-colors ${
              error
                ? "border-red-300 focus:ring-red-300"
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
        </div>

      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
