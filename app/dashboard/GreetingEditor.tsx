"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "@/app/tasks/actions";

export default function GreetingEditor({ name }: { name: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = value.trim();
    startTransition(async () => {
      await updateDisplayName(trimmed);
      setIsEditing(false);
    });
  }

  function handleCancel() {
    setValue(name);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">Hey,</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
          maxLength={30}
          placeholder="Your name"
          className="text-2xl font-extrabold bg-transparent border-b-2 border-violet-400 focus:outline-none text-violet-600 w-36 placeholder-gray-300 dark:placeholder-gray-600"
        />
        <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">👋</span>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={handleCancel}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
        Hey, {name}! 👋
      </h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
        aria-label="Edit display name"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  );
}
