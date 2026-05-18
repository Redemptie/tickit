"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/tasks/actions";

const PRESETS = [1, 5, 10, 20];

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // selectedPreset = which preset button is active (null means custom input is active)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10);
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  // Work out the final points value to send with the form
  const isCustomActive = selectedPreset === null;
  const customNum = parseInt(customValue, 10);
  const isCustomValid = customValue !== "" && !isNaN(customNum) && customNum >= 1 && customNum <= 50;
  const effectivePoints = selectedPreset !== null ? selectedPreset : (isCustomValid ? customNum : 10);

  // Disable submit if the custom input is active but has an invalid value
  const canSubmit = !isCustomActive || isCustomValid;

  function handlePresetClick(pts: number) {
    setSelectedPreset(pts);
    setCustomValue("");       // clear the custom input
    setCustomError(null);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSelectedPreset(null);  // deselect all preset buttons
    setCustomValue(val);

    // Validate while typing (but only show error when the field is not empty)
    if (val === "") {
      setCustomError(null);
    } else {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > 50) {
        setCustomError("Points must be between 1 and 50");
      } else {
        setCustomError(null);
      }
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
        // Reset points selector back to the default after a successful save
        setSelectedPreset(10);
        setCustomValue("");
        setCustomError(null);
      }
    });
  }

  return (
    <div className="mb-6">

      {/* ── Points selector row ── */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Points:</span>

        {/* Preset buttons */}
        {PRESETS.map((pts) => (
          <button
            key={pts}
            type="button"
            onClick={() => handlePresetClick(pts)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              selectedPreset === pts
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-violet-100 hover:text-violet-600"
            }`}
          >
            {pts === 1 ? "1 pt" : `${pts} pts`}
          </button>
        ))}

        {/* Custom number input */}
        <input
          type="number"
          value={customValue}
          onChange={handleCustomChange}
          placeholder="custom"
          min="1"
          max="50"
          className={`w-20 border rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-2 transition-colors ${
            customError
              ? "border-red-300 focus:ring-red-300"
              : isCustomActive
              ? "border-violet-400 ring-1 ring-violet-400"   // highlight when active
              : "border-gray-200 focus:ring-violet-400"
          }`}
        />
      </div>

      {/* Custom input validation error */}
      {customError && (
        <p className="text-xs text-red-500 mb-2 pl-1">{customError}</p>
      )}

      {/* ── Task input row ── */}
      <form ref={formRef} action={handleSubmit} className="flex gap-2">

        {/* Hidden field carries the resolved points value into createTask */}
        <input type="hidden" name="points" value={effectivePoints} />

        <input
          name="title"
          type="text"
          required
          placeholder="Add a new task..."
          className={`flex-1 border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 text-sm transition-colors ${
            error ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-violet-400"
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

      {/* Server action error */}
      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          ⚠️ {error}
        </p>
      )}

    </div>
  );
}
