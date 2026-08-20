"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import BossMode from "@/components/BossMode";
import BallpitWordmark from "@/components/BallpitWordmark";
import TrashPitMark from "@/components/TrashPitMark";
import { supabase } from "@/lib/supabaseClient";
import {
  WIDGET_CATALOG,
  loadWidgetLayout,
  saveWidgetLayout,
  type WidgetId,
} from "@/lib/widgetLayout";

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
  root.classList.toggle("pit-light", textMode === "black");

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
  const [bossOn, setBossOn] = useState(false);
  const [bgColor, setBgColor] = useState("#1E2022");
  const [highlightColor, setHighlightColor] = useState("#F0A04B");
  const [textMode, setTextMode] = useState<TextMode>("white");
  const [open, setOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([]);
  const [widgetOn, setWidgetOn] = useState<Record<WidgetId, boolean>>({} as Record<WidgetId, boolean>);
  const [dragId, setDragId] = useState<WidgetId | null>(null);
  const [overId, setOverId] = useState<WidgetId | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [bossKey, setBossKey] = useState("Numpad5");

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
    const layout = loadWidgetLayout();
    setWidgetOrder(layout.order);
    setWidgetOn(layout.on);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isIn = Boolean(session?.user);
      setLoggedIn(isIn);
      setOpen(false);
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

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
      if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) setLayoutOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
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

  const resetTheme = () => {
    setBgColor("#1E2022");
    setHighlightColor("#F0A04B");
    setTextMode("white");
    applyTheme("#1E2022", "#F0A04B", "white");
  };

  useEffect(() => {
    try {
      const k = localStorage.getItem("ballpit-boss-hotkey") || "";
      const ok = [
        "Escape",
        "Numpad0",
        "Numpad1",
        "Numpad5",
        "Numpad8",
        "NumpadEnter",
        "Digit5",
      ];
      if (ok.includes(k)) setBossKey(k);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === bossKey) {
        e.preventDefault();
        setBossOn((v) => !v);
        return;
      }
      if (e.code === "Escape") setBossOn(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [bossKey]);

  return (
    <>
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
        <div className="flex items-center shrink-0 min-w-0">
          <BallpitWordmark size="md" />
        </div>

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
              {item.label === "Satire" ? <TrashPitMark size="nav" /> : item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {loggedIn && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="h-8 w-8 rounded-full border border-white/20 overflow-hidden shadow-sm"
                title="Studio"
                style={{
                  background: `linear-gradient(135deg, ${bgColor} 50%, ${highlightColor} 50%)`,
                }}
              />

              {open && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 p-3 shadow-2xl z-50"
                  style={{
                    background: "color-mix(in srgb, var(--pit-panel) 94%, black 6%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.18em] mb-3"
                    style={{ color: "var(--pit-muted)" }}
                  >
                    Studio
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs" style={{ color: "var(--pit-muted)" }}>
                      Background
                    </span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => onBg(e.target.value)}
                      className="w-9 h-8 p-0 border border-white/15 rounded-md cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs" style={{ color: "var(--pit-muted)" }}>
                      Highlight
                    </span>
                    <input
                      type="color"
                      value={highlightColor}
                      onChange={(e) => onHighlight(e.target.value)}
                      className="w-9 h-8 p-0 border border-white/15 rounded-md cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs" style={{ color: "var(--pit-muted)" }}>
                      Text
                    </span>
                    <button
                      type="button"
                      onClick={toggleBW}
                      className="h-8 min-w-12 px-2 rounded-md text-xs font-bold border border-white/15"
                      style={{
                        background: textMode === "white" ? "#111" : "#f3f4f6",
                        color: textMode === "white" ? "#fff" : "#111",
                      }}
                    >
                      BW
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={resetTheme}
                    className="w-full mt-1 text-xs px-3 py-2 rounded-lg btn-metal"
                  >
                    Reset steel
                  </button>
                </div>
              )}
            </div>
          )}

          {loggedIn && (
            <div className="relative" ref={layoutRef}>
              <button
                type="button"
                onClick={() => {
                  setLayoutOpen((v) => !v);
                  setOpen(false);
                }}
                className="btn-metal text-xs px-3 py-1.5 rounded-lg"
              >
                Layout
              </button>
              {layoutOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 p-3 shadow-2xl z-50"
                  style={{
                    background: "color-mix(in srgb, var(--pit-panel) 94%, black 6%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: "var(--pit-muted)" }}>
                    Layout
                  </div>
                  <p className="text-[11px] text-muted-pit mb-3">
                    Check to show. Drag to stack your deck.
                  </p>
                  <div className="space-y-1">
                    {widgetOrder.map((id) => {
                      const label = WIDGET_CATALOG.find((w) => w.id === id)?.label || id;
                      const on = !!widgetOn[id];
                      return (
                        <div
                          key={id}
                          draggable
                          onDragStart={() => setDragId(id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (overId !== id) setOverId(id);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!dragId || dragId === id) {
                              setDragId(null);
                              setOverId(null);
                              return;
                            }
                            const next = widgetOrder.filter((x) => x !== dragId);
                            next.splice(next.indexOf(id), 0, dragId);
                            setWidgetOrder(next);
                            saveWidgetLayout(next, widgetOn);
                            setDragId(null);
                            setOverId(null);
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverId(null);
                          }}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                          style={{
                            opacity: dragId === id ? 0.45 : 1,
                            outline:
                              overId === id && dragId && dragId !== id
                                ? "1px solid var(--pit-highlight)"
                                : "1px solid transparent",
                            background: on ? "rgba(255,255,255,0.04)" : "transparent",
                          }}
                        >
                          <span
                            className="cursor-grab active:cursor-grabbing text-muted-pit select-none text-sm leading-none px-0.5"
                            title="Drag to reorder"
                          >
                            ⋮⋮
                          </span>
                          <span
                            className="flex-1 text-sm select-none"
                            style={{
                              color: on ? "var(--pit-text)" : "var(--pit-muted)",
                            }}
                          >
                            {label}
                          </span>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => {
                              const next = { ...widgetOn, [id]: !on };
                              setWidgetOn(next);
                              saveWidgetLayout(widgetOrder, next);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="h-4 w-4"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: "var(--pit-muted)" }}>
                      Boss trigger
                    </div>
                    <select
                      value={bossKey}
                      onChange={(e) => {
                        const next = e.target.value;
                        setBossKey(next);
                        try {
                          localStorage.setItem("ballpit-boss-hotkey", next);
                        } catch {
                          // ignore
                        }
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                      style={{
                        background: "rgba(0,0,0,0.25)",
                        color: "var(--pit-text)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <option value="Numpad5">Keypad 5</option>
                      <option value="Numpad0">Keypad 0</option>
                      <option value="Numpad1">Keypad 1</option>
                      <option value="Numpad8">Keypad 8</option>
                      <option value="NumpadEnter">Keypad Enter</option>
                      <option value="Digit5">Top-row 5 (next to %)</option>
                      <option value="Escape">Escape</option>
                    </select>
                    <p className="text-[10px] text-muted-pit mt-1">
                      Keypad 5 is not the 5 under %. If trigger is not Esc, Esc still leaves.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <Link
            href="/editor"
            className="btn-write hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm"
          >
            Write
          </Link>
          <Link
            href="/trashpit"
            className="btn-metal hidden lg:inline-flex items-center px-3 py-1.5 rounded-xl text-xs"
          >
            <TrashPitMark size="nav" />
          </Link>
          <button
            type="button"
            onClick={() => setBossOn((v) => !v)}
            className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-lg text-[11px] uppercase tracking-[0.14em]"
            style={{ color: "var(--pit-muted)" }}
            title="Fake office screen. Esc to leave."
          >
            Boss
          </button>
          <AuthNav />
        </div>
      </div>
    </header>
    <BossMode on={bossOn} onClose={() => setBossOn(false)} />
    </>
  );
}


