"use client";

import { useState } from "react";
import Link from "next/link";
import {
  creditCost,
  JOB_LABEL,
  MODEL_LABEL,
  type AiJob,
  type AiModel,
} from "@/lib/creditTable";

export default function ComputeButton({
  cost,
  job,
  model = "haiku",
  label,
  busy = false,
  disabled = false,
  onConfirm,
}: {
  cost?: number;
  job?: AiJob;
  model?: AiModel;
  label: string;
  busy?: boolean;
  disabled?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const lookedUp = job ? creditCost(job, model) : null;
  const n = Math.max(0, Number(cost ?? lookedUp ?? 0) || 0);
  const locked = disabled || busy || working || lookedUp === null;

  const go = async () => {
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={locked}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
        style={{
          background:
            "linear-gradient(180deg, #F4F7FB 0%, #C8CDD2 48%, #8B9298 100%)",
          color: "#1E2022",
          border: "1px solid #D4A056",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 0 rgba(0,0,0,0.35)",
        }}
      >
        <span aria-hidden className="inline-grid grid-cols-2 gap-[2px] shrink-0">
          <span className="w-1.5 h-1.5 rounded-[1px] bg-[#1E2022]" />
          <span className="w-1.5 h-1.5 rounded-[1px] bg-[#D4A056]" />
          <span className="w-1.5 h-1.5 rounded-[1px] bg-[#D4A056]" />
          <span className="w-1.5 h-1.5 rounded-[1px] bg-[#1E2022]" />
        </span>
        <span>{busy || working ? "Computing..." : label}</span>
        <span style={{ color: "#7A5A22" }}>· {n}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.62)" }}
          onClick={() => !working && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 border"
            style={{
              background: "color-mix(in srgb, var(--pit-panel) 94%, black 6%)",
              borderColor: "rgba(212,160,86,0.45)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: "#D4A056" }}>
              AI compute
            </div>
            <p className="text-lg font-extrabold mb-2" style={{ letterSpacing: "-0.03em" }}>
              <span style={{ color: "#F4F7FB" }}>This spends </span>
              <span style={{ color: "#D4A056" }}>
                {n} credit{n === 1 ? "" : "s"}.
              </span>
            </p>
            {job && (
              <p className="text-sm text-muted-pit mb-1">
                {JOB_LABEL[job]} · {MODEL_LABEL[model]}
              </p>
            )}
            <p className="text-sm text-muted-pit mb-4">
              No refund if the result is weak, blocked, or not what you wanted.
              Credits leave theMoneyPit when you confirm.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-metal flex-1 px-3 py-2 rounded-xl text-sm"
                disabled={working}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{
                  background: "linear-gradient(180deg, #F4F7FB 0%, #C8CDD2 48%, #8B9298 100%)",
                  color: "#1E2022",
                  border: "1px solid #D4A056",
                }}
                disabled={working}
                onClick={go}
              >
                {working ? "Spending..." : `Spend ${n}`}
              </button>
            </div>
            <p className="text-[11px] text-muted-pit mt-3">
              Need more?{" "}
              <Link href="/wallet" className="text-highlight-pit">
                theMoneyPit
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

