"use client";

import { useState } from "react";
import { useTheme, VibeId } from "./ThemeProvider";

const OPTIONS: { id: VibeId; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "futuristic", label: "Futuristic" },
  { id: "arena", label: "Arena" },
  { id: "nightgame", label: "Night Game" },
  { id: "custom", label: "Custom" },
];

export default function VibeSwitcher() {
  const { vibe, accent, setVibe, setAccent } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 hover:border-white/30 transition"
      >
        Vibe
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#1f2937] shadow-xl p-3 z-50">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Site vibe
          </div>
          <div className="space-y-1 mb-3">
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVibe(opt.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  vibe === opt.id
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3">
            <label className="block text-xs text-gray-400 mb-1.5">
              Accent color
            </label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
