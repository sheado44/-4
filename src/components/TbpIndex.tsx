"use client";

import { useState } from "react";

type Breakdown = {
  journalistic: number | null;
  truth: number | null;
  effort: number | null;
  community: number | null;
  communityStars: number | null;
  index100: number | null;
};

const W = {
  journalistic: 0.4,
  truth: 0.25,
  effort: 0.15,
  community: 0.2,
};

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function starsToHundred(avg: number) {
  return clamp100((avg / 5) * 100);
}

export function computeTbpBreakdown(
  aiScore: number | null | undefined,
  _body: string | null | undefined,
  avgRating: number | null | undefined
): Breakdown {
  const hasAi = aiScore != null && Number.isFinite(Number(aiScore));
  const ai = hasAi ? clamp100(Number(aiScore)) : null;

  const journalistic = ai == null ? null : clamp100(ai);
  const truth = ai == null ? null : clamp100(ai);
  const effort = ai == null ? null : clamp100(ai);

  const communityStars =
    avgRating != null && Number.isFinite(Number(avgRating))
      ? Math.max(0, Math.min(5, Number(avgRating)))
      : null;
  const community = communityStars == null ? null : starsToHundred(communityStars);

  const parts = [
    journalistic == null ? null : journalistic * W.journalistic,
    truth == null ? null : truth * W.truth,
    effort == null ? null : effort * W.effort,
    community == null ? null : community * W.community,
  ].filter((n): n is number => n != null);

  const index100 = parts.length === 0 ? null : clamp100(parts.reduce((a, b) => a + b, 0));

  return { journalistic, truth, effort, community, communityStars, index100 };
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rounded} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative inline-block w-3.5 h-3.5 text-[14px] leading-none">
            <span className="absolute inset-0" style={{ color: "rgba(255,255,255,0.18)" }}>
              ★
            </span>
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{
                  width: fill === 0.5 ? "50%" : "100%",
                  color: "#F0A04B",
                }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function Row({
  label,
  share,
  extra,
  raw,
  weight,
  rightExtra,
}: {
  label: string;
  share: string;
  extra?: string;
  raw: number | null;
  weight: number;
  rightExtra?: React.ReactNode;
}) {
  const weighted = raw == null ? null : Math.round(raw * weight * 10) / 10;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="text-xs font-semibold" style={{ color: "var(--pit-text)" }}>
          {label}
        </div>
        <div className="text-[10px] text-muted-pit">
          {share} of that score{extra ? ` · ${extra}` : ""}
        </div>
      </div>
      <div className="text-right shrink-0">
        {rightExtra}
        {raw == null ? (
          <div className="text-xs text-muted-pit">
            —<div className="text-[10px]">no data</div>
          </div>
        ) : (
          <div>
            <div className="text-sm font-bold">{weighted}</div>
            <div className="text-[10px] text-muted-pit">{Math.round(raw)} × weight</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TbpIndex({
  aiScore,
  body,
  avgRating,
  ratingCount = 0,
}: {
  aiScore: number | null | undefined;
  body?: string | null;
  avgRating: number | null | undefined;
  ratingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const b = computeTbpBreakdown(aiScore, body, avgRating);
  const shown = b.index100 == null ? "—" : Math.round(b.index100);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left rounded-xl px-3 py-2.5 border border-white/10 hover:opacity-95 transition"
        style={{
          background:
            "linear-gradient(180deg, rgba(240,160,75,0.16), rgba(0,0,0,0.22))",
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit font-semibold mb-0.5">
          tBp Index
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold leading-none" style={{ color: "var(--pit-text)" }}>
            {shown}
          </div>
          <div className="text-[10px] text-muted-pit mb-0.5">/ 100 · tap for breakdown</div>
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-2 z-30 rounded-xl border border-white/10 p-3 shadow-2xl"
          style={{
            background: "color-mix(in srgb, var(--pit-panel) 96%, black 4%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">
            How this number is built
          </div>

          <Row
            label="Journalistic style"
            share="40%"
            raw={b.journalistic}
            weight={W.journalistic}
          />
          <Row label="Truth telling" share="25%" raw={b.truth} weight={W.truth} />
          <Row label="Overall effort" share="15%" raw={b.effort} weight={W.effort} />
          <Row
            label="Community stars"
            share="20%"
            extra={ratingCount ? `${ratingCount} rating${ratingCount === 1 ? "" : "s"}` : "no ratings"}
            raw={b.community}
            weight={W.community}
            rightExtra={
              b.communityStars != null ? (
                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                  <Stars value={b.communityStars} />
                  <span className="text-[11px] font-semibold text-highlight-pit">
                    {b.communityStars.toFixed(1)}
                  </span>
                </div>
              ) : null
            }
          />

          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-muted-pit">Sum of weighted parts</div>
            <div className="text-sm font-bold text-highlight-pit">{shown} / 100</div>
          </div>
        </div>
      )}
    </div>
  );
}
