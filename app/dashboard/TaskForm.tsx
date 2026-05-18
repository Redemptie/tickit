"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/tasks/actions";

const PRESETS = [1, 5, 10, 20];
const CATEGORIES = ["Work", "School", "Health", "Personal", "Other"] as const;

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(10);
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Other");

  const isCustomActive = selectedPreset === null;
  const customNum = parseInt(customValue, 10);
  const isCustomValid = customValue !== "" && !isNaN(customNum) && customNum >= 1 && customNum <= 50;
  const effectivePoints = selectedPreset !== null ? selectedPreset : (isCustomValid ? customNum : 10);
  const canSubmit = !isCustomActive || isCustomValid;

  function handlePresetClick(pts: number) {
    setSelectedPreset(pts);
    setCustomValue("");
    setCustomError(null);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSelectedPreset(null);
    setCustomValue(val);
    if (val === "") {
      setCustomError(null);
    } else {
      const num = parseInt(val, 10);
      setCustomError(isNaN(num) || num < 1 || num > 50 ? "Points must be between 1 and 50" : null);
    }
  }

  function handleSubmit(formData: FormData) {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await createTask(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setSelectedPreset(10);
        setCustomValue("");
        setCustomError(null);
        setSelectedCategory("Other");
      }
    });
  }

  return (
    <div className="mb-6">

      {/* ── Points selector ── */}
      <div className="flex items-center gap-1 sm:gap-2 mb-2">
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">Points:</span>
        {PRESETS.map((pts) => (
          <button
            key={pts}
            type="button"
            onClick={() => handlePresetClick(pts)}
            className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-colors shrink-0 ${
              selectedPreset === pts
                ? "bg-violet-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-600 dark:hover:text-violet-300"
            }`}
          >
            {pts === 1 ? "1 pt" : `${pts} pts`}
          </button>
        ))}
        <input
          type="number"
          value={customValue}
          onChange={handleCustomChange}
          placeholder="custom"
          min="1"
          max="50"
          className={`w-14 sm:w-20 bg-white dark:bg-gray-800 border rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors ${
            customError
              ? "border-red-300 focus:ring-red-300"
              : isCustomActive
              ? "border-violet-400 ring-1 ring-violet-400"
              : "border-gray-300 dark:border-gray-600 focus:ring-violet-400"
          }`}
        />
      </div>
      {customError && (
        <p className="text-xs text-red-500 mb-2 pl-1">{customError}</p>
      )}

      {/* ── Category selector ── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Category:</span>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* ── Task input row ── */}
      <form ref={formRef} action={handleSubmit} className="flex gap-2">
        <input type="hidden" name="points" value={effectivePoints ?? 10} />
        <input type="hidden" name="category" value={selectedCategory} />

        <input
          name="title"
          type="text"
          required
          placeholder="Add a new task..."
          className={`flex-1 bg-white dark:bg-gray-800 border rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 text-sm transition-colors ${
            error ? "border-red-300 focus:ring-red-300" : "border-gray-300 dark:border-gray-600 focus:ring-violet-400"
          }`}
        />
        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          {isPending ? "Adding..." : "+ Add Task"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
