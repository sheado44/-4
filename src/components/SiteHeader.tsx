"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthNav from "@/app/AuthNav";
import { supabase } from "@/lib/supabaseClient";

type TextMode = "white" | "black";

function applyTheme(bg: string, highlight: string, textMode: TextMode) {
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

  localStorage.setItem("ballpit-bg", bg);
  localStorage.setItem("ballpit-highlight", highlight);
  localStorage.setItem("ballpit-text", textMode);
  window.dispatchEvent(new Event("ballpit-theme-updated"));
}

function applyDefaultSteel() {
  applyTheme("#1E2022", "#F0A04B", "white");
}

export default function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [bgColor, setBgColor] = useState("#1E2022");
  const [highlightColor, setHighlightColor] = useState("#F0A04B");
  const [textMode, setTextMode] = useState<TextMode>("white");

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setLoggedIn(Boolean(user));

      if (!user) {
        applyDefaultSteel();
        return;
      }

      const bg = localStorage.getItem("ballpit-bg") || "#1E2022";
      const hi = localStorage.getItem("ballpit-highlight") || "#F0A04B";
      const tx = (localStorage.getItem("ballpit-text") as TextMode) || "white";
      setBgColor(bg);
      setHighlightColor(hi);
      setTextMode(tx === "black" ? "black" : "white");
      applyTheme(bg, hi, tx === "black" ? "black" : "white");
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isIn = Boolean(session?.user);
      setLoggedIn(isIn);
      if (!isIn) {
        applyDefaultSteel();
      } else {
        const bg = localStorage.getItem("ballpit-bg") || "#1E2022";
        const hi = localStorage.getItem("ballpit-highlight") || "#F0A04B";
        const tx = (localStorage.getItem("ballpit-text") as TextMode) || "white";
        setBgColor(bg);
        setHighlightColor(hi);
        setTextMode(tx === "black" ? "black" : "white");
        applyTheme(bg, hi, tx === "black" ? "black" : "white");
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const onBg = (value: string) => {
    setBgColor(value);
    applyTheme(value, highlightColor, textMode);
  };

  const onHighlight = (value: string) => {
    setHighlightColor(value);
    applyTheme(bgColor, value, textMode);
  };

  const toggleBW = () => {
    const next: TextMode = textMode === "white" ? "black" : "white";
    setTextMode(next);
    applyTheme(bgColor, highlightColor, next);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--pit-bg) 92%, white 6%), var(--pit-bg))",
        borderColor: "rgba(127,127,127,0.22)",
        color: "var(--pit-text)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center shrink-0 group">
          <img
            src="/ballpit-wordmark.png"
            alt="The Ballpit"
            className="h-8 md:h-9 w-auto object-contain opacity-95 group-hover:opacity-100 transition"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {[
            { href: "/", label: "Home" },
            { href: "/?section=Sports", label: "Sports" },
            { href: "/?section=Pop%20Culture", label: "Pop Culture" },
            { href: "/?section=Satire", label: "Satire" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-lg transition hover:opacity-100"
              style={{ color: "var(--pit-muted)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Studio tiles — logged in only */}
          {loggedIn && (
            <div className="flex items-center gap-1.5 mr-1">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => onBg(e.target.value)}
                title="Background"
                className="w-7 h-7 p-0 border border-white/20 rounded-md cursor-pointer bg-transparent"
              />
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => onHighlight(e.target.value)}
                title="Highlight"
                className="w-7 h-7 p-0 border border-white/20 rounded-md cursor-pointer bg-transparent"
              />
              <button
                type="button"
                onClick={toggleBW}
                title="Toggle black / white text"
                className="h-7 min-w-7 px-1.5 rounded-md text-[10px] font-bold tracking-wide border border-white/20"
                style={{
                  background: textMode === "white" ? "#111" : "#f3f4f6",
                  color: textMode === "white" ? "#fff" : "#111",
                }}
              >
                BW
              </button>
            </div>
          )}

          <Link
            href="/editor"
            className="btn-write hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm"
          >
            Write
          </Link>
          <Link
            href="/fan-fiction"
            className="btn-metal hidden lg:inline-flex items-center px-3 py-1.5 rounded-xl text-xs"
          >
            Satire Lab
          </Link>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
