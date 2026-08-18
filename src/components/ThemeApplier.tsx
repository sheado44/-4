"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

function applyTheme(bg: string, highlight: string, textMode: "white" | "black") {
  const text = textMode === "white" ? "#E8EAED" : "#121212";
  const muted = textMode === "white" ? "#A7AEB4" : "#4B5563";
  const panel = textMode === "white" ? "#252729" : "#F3F4F6";
  const card = textMode === "white" ? "#2A2D30" : "#FFFFFF";

  const root = document.documentElement;
  root.style.setProperty("--pit-bg", bg);
  root.style.setProperty("--pit-highlight", highlight);
  root.style.setProperty("--pit-text", text);
  root.style.setProperty("--pit-muted", muted);
  root.style.setProperty("--pit-panel", panel);
  root.style.setProperty("--pit-card", card);

  document.body.style.backgroundColor = bg;
  document.body.style.color = text;
}

export default function ThemeApplier() {
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        applyTheme("#1E2022", "#F0A04B", "white");
        return;
      }

      const bg = localStorage.getItem("ballpit-bg") || "#1E2022";
      const hi = localStorage.getItem("ballpit-highlight") || "#F0A04B";
      const tx = localStorage.getItem("ballpit-text") === "black" ? "black" : "white";
      applyTheme(bg, hi, tx);
    };

    run();

    const onUpdate = () => run();
    window.addEventListener("ballpit-theme-updated", onUpdate);
    window.addEventListener("storage", onUpdate);

    return () => {
      window.removeEventListener("ballpit-theme-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return null;
}
