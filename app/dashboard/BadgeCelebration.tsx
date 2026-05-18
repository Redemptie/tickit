"use client";

import { useEffect, useState } from "react";

const BADGE_ORDER = ["Beginner", "Productive", "Grinder", "Legend"];
const STORAGE_KEY = "tickit_badge_tier";

const CONFETTI_COLORS = ["#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"];

const BADGE_META: Record<string, { emoji: string; label: string; textColor: string; bgColor: string }> = {
  Productive: { emoji: "⚡", label: "Productive",  textColor: "#2563eb", bgColor: "#eff6ff" },
  Grinder:    { emoji: "💪", label: "Grinder",     textColor: "#7c3aed", bgColor: "#f5f3ff" },
  Legend:     { emoji: "🏆", label: "Legend",      textColor: "#d97706", bgColor: "#fffbeb" },
};

export default function BadgeCelebration({ currentTier }: { currentTier: string }) {
  const [show, setShow] = useState(false);
  const [unlockedTier, setUnlockedTier] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? "Beginner";
    const storedIdx  = BADGE_ORDER.indexOf(stored);
    const currentIdx = BADGE_ORDER.indexOf(currentTier);

    if (currentIdx > storedIdx) {
      // Tier went up — celebrate!
      setUnlockedTier(currentTier);
      setShow(true);
      localStorage.setItem(STORAGE_KEY, currentTier);
      const t = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(t);
    } else {
      // Stay in sync so future upgrades are detected correctly
      localStorage.setItem(STORAGE_KEY, currentTier);
    }
  }, [currentTier]);

  if (!show) return null;
  const meta = BADGE_META[unlockedTier];
  if (!meta) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setShow(false)}
    >
      {/* CSS-only confetti */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width:  i % 3 === 0 ? "14px" : "10px",
            height: i % 3 === 0 ? "14px" : "10px",
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            left: `${8 + (i * 6) % 84}%`,
            top: "55%",
            animation: `confetti-fall ${0.9 + (i % 4) * 0.15}s ${i * 0.07}s ease-out forwards`,
          }}
        />
      ))}

      {/* Badge card */}
      <div
        className="relative flex flex-col items-center gap-4 rounded-3xl px-12 py-10 shadow-2xl text-center mx-4"
        style={{
          background: meta.bgColor,
          animation: "badge-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: "5rem", lineHeight: 1 }}>{meta.emoji}</span>

        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">
            New Badge Unlocked!
          </p>
          <p className="text-4xl font-extrabold" style={{ color: meta.textColor }}>
            {meta.label}
          </p>
        </div>

        <button
          onClick={() => setShow(false)}
          className="mt-1 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Tap to dismiss
        </button>
      </div>
    </div>
  );
}
