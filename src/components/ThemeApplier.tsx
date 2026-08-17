"use client";

import { useEffect } from "react";

export default function ThemeApplier() {
  useEffect(() => {
    const apply = () => {
      const bg = localStorage.getItem("ballpit-bg") || "#1E2022";
      const hi = localStorage.getItem("ballpit-highlight") || "#F0A04B";
      const textMode = localStorage.getItem("ballpit-text") || "white";

      const text = textMode === "black" ? "#121212" : "#E8EAED";
      const muted = textMode === "black" ? "#4B5563" : "#A7AEB4";
      const panel = textMode === "black" ? "#F3F4F6" : "#252729";
      const card = textMode === "black" ? "#FFFFFF" : "#2A2D30";

      const root = document.documentElement;
      root.style.setProperty("--pit-bg", bg);
      root.style.setProperty("--pit-highlight", hi);
      root.style.setProperty("--pit-text", text);
      root.style.setProperty("--pit-muted", muted);
      root.style.setProperty("--pit-panel", panel);
      root.style.setProperty("--pit-card", card);

      document.body.style.backgroundColor = bg;
      document.body.style.color = text;
    };

    apply();

    // pick up changes from Home studio controls in same tab
    const onStorage = () => apply();
    window.addEventListener("storage", onStorage);
    window.addEventListener("ballpit-theme-updated", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ballpit-theme-updated", onStorage);
    };
  }, []);

  return null;
}
