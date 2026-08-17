"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type VibeId = "standard" | "futuristic" | "arena" | "nightgame" | "custom";

type ThemeContextValue = {
  vibe: VibeId;
  accent: string;
  setVibe: (vibe: VibeId) => void;
  setAccent: (accent: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const VIBE_PRESETS: Record<Exclude<VibeId, "custom">, { accent: string; bg: string; card: string; text: string }> = {
  standard: {
    accent: "#f97316",
    bg: "#6b7280",
    card: "#525c6a",
    text: "#f3f4f6",
  },
  futuristic: {
    accent: "#22d3ee",
    bg: "#0b1220",
    card: "#111827",
    text: "#e2e8f0",
  },
  arena: {
    accent: "#fb923c",
    bg: "#111111",
    card: "#1c1c1c",
    text: "#f5f5f5",
  },
  nightgame: {
    accent: "#4ade80",
    bg: "#0f172a",
    card: "#1e293b",
    text: "#ecfdf5",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [vibe, setVibeState] = useState<VibeId>("standard");
  const [accent, setAccentState] = useState("#f97316");

  useEffect(() => {
    const savedVibe = localStorage.getItem("ballpit-vibe") as VibeId | null;
    const savedAccent = localStorage.getItem("ballpit-accent");
    if (savedVibe) setVibeState(savedVibe);
    if (savedAccent) setAccentState(savedAccent);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const preset = vibe === "custom" ? null : VIBE_PRESETS[vibe];

    const nextAccent = vibe === "custom" ? accent : preset!.accent;
    const nextBg = preset?.bg || "#6b7280";
    const nextCard = preset?.card || "#525c6a";
    const nextText = preset?.text || "#f3f4f6";

    root.style.setProperty("--ballpit-accent", nextAccent);
    root.style.setProperty("--ballpit-bg", nextBg);
    root.style.setProperty("--ballpit-card", nextCard);
    root.style.setProperty("--ballpit-text", nextText);

    document.body.style.background = nextBg;
    document.body.style.color = nextText;

    localStorage.setItem("ballpit-vibe", vibe);
    localStorage.setItem("ballpit-accent", nextAccent);
  }, [vibe, accent]);

  const setVibe = (next: VibeId) => {
    setVibeState(next);
    if (next !== "custom") {
      setAccentState(VIBE_PRESETS[next].accent);
    }
  };

  const setAccent = (next: string) => {
    setAccentState(next);
    setVibeState("custom");
  };

  return (
    <ThemeContext.Provider value={{ vibe, accent, setVibe, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
