"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type VibeId = "standard" | "futuristic" | "arena" | "nightgame" | "custom";

type ThemeContextValue = {
  vibe: VibeId;
  accent: string;
  setVibe: (vibe: VibeId) => void;
  setAccent: (accent: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const VIBE_PRESETS: Record<
  Exclude<VibeId, "custom">,
  { accent: string; bg: string; card: string; text: string }
> = {
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

function applyTheme(vibe: VibeId, accent: string) {
  if (typeof document === "undefined") return;

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
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [vibe, setVibeState] = useState<VibeId>("standard");
  const [accent, setAccentState] = useState("#f97316");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      const savedVibe = localStorage.getItem("ballpit-vibe") as VibeId | null;
      const savedAccent = localStorage.getItem("ballpit-accent");

      let nextVibe: VibeId = savedVibe || "standard";
      let nextAccent = savedAccent || "#f97316";

      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_vibe, accent_color")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.preferred_vibe) nextVibe = profile.preferred_vibe as VibeId;
        if (profile?.accent_color) nextAccent = profile.accent_color;
      } else {
        setUserId(null);
      }

      setVibeState(nextVibe);
      setAccentState(nextAccent);
      applyTheme(nextVibe, nextAccent);
    };

    boot();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      boot();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const persistToProfile = async (nextVibe: VibeId, nextAccent: string) => {
    if (!userId) return;
    await supabase.from("profiles").upsert({
      id: userId,
      preferred_vibe: nextVibe,
      accent_color: nextAccent,
      updated_at: new Date().toISOString(),
    });
  };

  const setVibe = (next: VibeId) => {
    const nextAccent = next === "custom" ? accent : VIBE_PRESETS[next].accent;
    setVibeState(next);
    setAccentState(nextAccent);
    applyTheme(next, nextAccent);
    persistToProfile(next, nextAccent);
  };

  const setAccent = (next: string) => {
    setAccentState(next);
    setVibeState("custom");
    applyTheme("custom", next);
    persistToProfile("custom", next);
  };

  return (
    <ThemeContext.Provider value={{ vibe, accent, setVibe, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Safe fallback so build/prerender never crashes
  if (!ctx) {
    return {
      vibe: "standard" as VibeId,
      accent: "#f97316",
      setVibe: () => {},
      setAccent: () => {},
    };
  }
  return ctx;
}
