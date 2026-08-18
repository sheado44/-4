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

function weighted(score100: number | null, weight: number) {
  if (score100 == null) return 0;
  return Math.round(score100 * weight * 10) / 10;
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

  const truth100 = toTbp100(truth);
  const style100 = toTbp100(style);
  const effort100 = toTbp100(effort);
  const community100 = toTbp100(community);

  const stylePts = weighted(style100, 0.4);
  const truthPts = weighted(truth100, 0.25);
  const effortPts = weighted(effort100, 0.15);
  const communityPts = weighted(community100, 0.2);

  const hasAny =
    style100 != null || truth100 != null || effort100 != null || community100 != null;
  const index100 = hasAny
    ? Math.round((stylePts + truthPts + effortPts + communityPts) * 10) / 10
    : null;

  return {
    truth,
    style,
    effort,
    community,
    index: index100 != null ? index100 / 10 : null,
    index100,
    truth100,
    style100,
    effort100,
    community100,
    stylePts,
    truthPts,
    effortPts,
    communityPts,
  };
}

export default function TbpIndex({ aiScore, body, avgRating, ratingCount = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const b = useMemo(
    () => computeTbpBreakdown(aiScore, body, avgRating),
    [aiScore, body, avgRating]
  );

  const rows = [
    {
      label: "Journalistic style",
      score: b.style100,
      pts: b.stylePts,
      note: "40% of that score",
    },
    {
      label: "Truth telling",
      score: b.truth100,
      pts: b.truthPts,
      note: "25% of that score",
    },
    {
      label: "Overall effort",
      score: b.effort100,
      pts: b.effortPts,
      note: "15% of that score",
    },
    {
      label: "Community stars",
      score: b.community100,
      pts: b.communityPts,
      note: ratingCount
        ? `20% of that score · ${ratingCount} rating${ratingCount === 1 ? "" : "s"}`
        : "20% of that score · none yet",
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
                <div className="text-right">
                  <div className="font-semibold">
                    {row.score != null ? `${row.pts}` : "—"}
                  </div>
                  <div className="text-[10px] text-muted-pit">
                    {row.score != null ? `${row.score} × weight` : "no data"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-muted-pit">Sum of weighted parts</span>
            <span className="text-lg font-bold text-highlight-pit">
              {b.index100 != null ? `${b.index100} / 100` : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
