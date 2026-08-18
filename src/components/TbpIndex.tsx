"use client";

import { useMemo, useState } from "react";

type Props = {
  aiScore?: number | null;
  body?: string;
  avgRating?: number | null;
  ratingCount?: number;
};

function clamp10(n: number) {
  return Math.max(0, Math.min(10, n));
}

export function toTbp100(score10: number | null | undefined) {
  if (score10 == null || !Number.isFinite(score10)) return null;
  return Math.round(clamp10(score10) * 10);
}

export function computeTbpBreakdown(
  aiScore: number | null | undefined,
  body: string | undefined,
  avgRating: number | null | undefined
) {
  const base = aiScore != null && Number.isFinite(aiScore) ? clamp10(Number(aiScore)) : null;
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;

  const truth = base != null ? clamp10(base) : null;
  const style = base != null ? clamp10(base - 0.3) : null;
  const effort =
    base != null ? clamp10(base * 0.7 + Math.min(3, words / 250)) : null;

  const community = avgRating != null ? clamp10(avgRating * 2) : null;

  const parts: { key: string; value: number; weight: number }[] = [];
  if (style != null) parts.push({ key: "style", value: style, weight: 0.4 });
  if (truth != null) parts.push({ key: "truth", value: truth, weight: 0.25 });
  if (effort != null) parts.push({ key: "effort", value: effort, weight: 0.15 });
  if (community != null) parts.push({ key: "community", value: community, weight: 0.2 });

  let index: number | null = null;
  if (parts.length > 0) {
    const weightSum = parts.reduce((s, p) => s + p.weight, 0);
    index = parts.reduce((s, p) => s + p.value * (p.weight / weightSum), 0);
  }

  return {
    truth,
    style,
    effort,
    community,
    index,
    index100: toTbp100(index),
    truth100: toTbp100(truth),
    style100: toTbp100(style),
    effort100: toTbp100(effort),
    community100: toTbp100(community),
  };
}

export default function TbpIndex({ aiScore, body, avgRating, ratingCount = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const b = useMemo(
    () => computeTbpBreakdown(aiScore, body, avgRating),
    [aiScore, body, avgRating]
  );

  const rows = [
    { label: "Journalistic style", value: b.style100, note: "40%" },
    { label: "Truth telling", value: b.truth100, note: "25%" },
    { label: "Overall effort", value: b.effort100, note: "15%" },
    {
      label: "Community stars",
      value: b.community100,
      note: ratingCount ? `20% · ${ratingCount} rating${ratingCount === 1 ? "" : "s"}` : "20% · none yet",
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left rounded-xl px-3 py-2.5 border"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--pit-highlight) 28%, transparent), rgba(0,0,0,0.25))",
          borderColor: "color-mix(in srgb, var(--pit-highlight) 45%, transparent)",
          boxShadow: "0 0 18px color-mix(in srgb, var(--pit-highlight) 18%, transparent)",
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.16em] text-highlight-pit font-semibold mb-0.5">
          tBp Index
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold leading-none" style={{ color: "var(--pit-text)" }}>
            {b.index100 != null ? b.index100 : "—"}
          </div>
          <div className="text-[10px] text-muted-pit">/ 100 · tap for breakdown</div>
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-2 z-30 rounded-xl border border-white/10 p-3 shadow-2xl"
          style={{
            background: "color-mix(in srgb, var(--pit-panel) 94%, black 6%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">
            How this number is built
          </div>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div style={{ color: "var(--pit-text)" }}>{row.label}</div>
                  <div className="text-[10px] text-muted-pit">{row.note}</div>
                </div>
                <div className="font-semibold">{row.value != null ? row.value : "—"}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-muted-pit">tBp Index</span>
            <span className="text-lg font-bold text-highlight-pit">
              {b.index100 != null ? `${b.index100} / 100` : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
