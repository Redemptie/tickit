"use client";

import { useState, useEffect, useTransition } from "react";
import { toggleTask, updateTask, deleteTask } from "@/app/tasks/actions";

const CATEGORY_COLOURS: Record<string, string> = {
  Work:     "bg-blue-100 text-blue-700",
  School:   "bg-amber-100 text-amber-700",
  Health:   "bg-green-100 text-green-700",
  Personal: "bg-pink-100 text-pink-700",
  Other:    "bg-gray-100 text-gray-500",
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
  points: number;
  category: string;
};

export default function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPoints, setEditPoints] = useState(task.points);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);
  useEffect(() => { setOptimisticCompleted(task.completed); }, [task.completed]);

  function handleToggle() {
    const next = !optimisticCompleted;
    setOptimisticCompleted(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleTask(task.id, task.completed);
      if (result.error) {
        setOptimisticCompleted(task.completed);
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.error) setError(result.error);
    });
  }

  function handleConfirmDelete() {
    setConfirmingDelete(false);
    handleDelete();
  }

  function handleSaveEdit() {
    if (!editTitle.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTask(task.id, editTitle, editPoints);
      if (result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
      }
    });
  }

  function handleCancelEdit() {
    setEditTitle(task.title);
    setEditPoints(task.points);
    setIsEditing(false);
    setError(null);
  }

  // ── Edit mode ──
  if (isEditing) {
    return (
      <li className="flex flex-col gap-1">
        <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")  handleSaveEdit();
              if (e.key === "Escape") handleCancelEdit();
            }}
            autoFocus
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <input
            type="number"
            value={editPoints}
            onChange={(e) => setEditPoints(Number(e.target.value))}
            min="1"
            max="50"
            className="w-16 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-center text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
            title="Points (1–50)"
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
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
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
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
          optimisticCompleted
            ? "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm hover:-translate-y-px"
        } ${isPending ? "opacity-50" : optimisticCompleted ? "opacity-75" : "opacity-100"}`}
      >
        {/* Toggle circle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-label={optimisticCompleted ? "Mark incomplete" : "Mark complete"}
          className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all active:scale-90 ${
            optimisticCompleted
              ? "bg-green-500 border-green-500"
              : "border-gray-300 dark:border-gray-600 hover:border-violet-400 bg-white dark:bg-gray-700"
          } ${isPending ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          {optimisticCompleted && (
            <svg
              className="w-4 h-4 text-white"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
              style={{ animation: "tickit-pop 0.25s ease" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Task title */}
        <span
          className={`text-sm flex-1 min-w-0 truncate ${
            optimisticCompleted
              ? "line-through text-gray-400 dark:text-gray-500"
              : "text-gray-700 dark:text-gray-200 font-medium"
          }`}
        >
          {task.title}
        </span>

        {/* Category label */}
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CATEGORY_COLOURS[task.category] ?? CATEGORY_COLOURS.Other}`}>
          {task.category}
        </span>

        {/* Points badge */}
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            optimisticCompleted ? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40" : "text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/40"
          }`}
        >
          {optimisticCompleted ? `+${task.points} ✓` : `+${task.points}`}
        </span>

        {/* Edit */}
        <button
          onClick={() => { setEditTitle(task.title); setEditPoints(task.points); setIsEditing(true); }}
          disabled={isPending}
          className="p-2 rounded-lg flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
          aria-label="Edit task"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => setConfirmingDelete(true)}
          disabled={isPending}
          className="p-2 rounded-lg flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label="Delete task"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Delete confirmation */}
      {confirmingDelete && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete this task?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
          ⚠️ {error}
        </p>
      )}
    </li>
  );
}
