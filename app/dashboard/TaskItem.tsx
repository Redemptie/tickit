"use client";

import { useState, useTransition } from "react";
import { toggleTask, updateTask, deleteTask } from "@/app/tasks/actions";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export default function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  // One error state covers toggle, edit, and delete errors
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleTask(task.id, task.completed);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.error) setError(result.error);
    });
  }

  function handleSaveEdit() {
    if (!editTitle.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTask(task.id, editTitle);
      if (result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
      }
    });
  }

  function handleCancelEdit() {
    setEditTitle(task.title);
    setIsEditing(false);
    setError(null);
  }

  // ── Edit mode ──
  if (isEditing) {
    return (
      // li wraps both the input row and any error message
      <li className="flex flex-col gap-1">
        <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-violet-300 bg-violet-50">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")  handleSaveEdit();
              if (e.key === "Escape") handleCancelEdit();
            }}
            autoFocus
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button
            onClick={handleSaveEdit}
            disabled={isPending || !editTitle.trim()}
            className="text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 px-4 py-2 rounded-lg transition-colors"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancelEdit}
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Error shown below the edit row */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            ⚠️ {error}
          </p>
        )}
      </li>
    );
  }

  // ── View mode ──
  return (
    <li className="flex flex-col gap-1">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
          task.completed
            ? "bg-green-50 border-green-100"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        {/* Toggle circle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all active:scale-90 ${
            task.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-violet-400 bg-white"
          } ${isPending ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Task title */}
        <span
          className={`text-sm flex-1 ${
            task.completed ? "line-through text-gray-400" : "text-gray-700 font-medium"
          }`}
        >
          {task.title}
        </span>

        {/* Points badge */}
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            task.completed ? "text-green-700 bg-green-100" : "text-violet-600 bg-violet-100"
          }`}
        >
          {task.completed ? "+10 ✓" : "+10"}
        </span>

        {/* Edit */}
        <button
          onClick={() => { setEditTitle(task.title); setIsEditing(true); }}
          disabled={isPending}
          className="text-xs text-gray-300 hover:text-violet-500 px-1.5 py-1 rounded-lg hover:bg-violet-50 transition-colors"
          aria-label="Edit task"
        >
          ✏️
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-gray-300 hover:text-red-400 px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
          aria-label="Delete task"
        >
          🗑️
        </button>
      </div>

      {/* Error shown below the task row */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          ⚠️ {error}
        </p>
      )}
    </li>
  );
}
