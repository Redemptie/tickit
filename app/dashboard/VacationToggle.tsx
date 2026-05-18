"use client";

import { useTransition } from "react";
import { setVacationMode } from "@/app/tasks/actions";

export default function VacationToggle({ isOn }: { isOn: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await setVacationMode(!isOn);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isOn}
      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
        isOn
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      <span>🏖️</span>
      <span>Vacation Mode</span>
      {/* pill toggle */}
      <div className={`w-9 h-5 rounded-full relative transition-colors ${isOn ? "bg-blue-500" : "bg-gray-300"}`}>
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            isOn ? "left-[18px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}
