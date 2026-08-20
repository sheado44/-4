"use client";

import {
  creditCost,
  MODEL_LABEL,
  modelsForPlan,
  type AiJob,
  type AiModel,
  type PlanId,
} from "@/lib/creditTable";

export default function ModelPicker({
  plan,
  job,
  value,
  onChange,
}: {
  plan: PlanId;
  job: AiJob;
  value: AiModel;
  onChange: (m: AiModel) => void;
}) {
  const opts = modelsForPlan(plan).filter((m) => creditCost(job, m) != null);
  if (opts.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {opts.map((m) => {
        const n = creditCost(job, m);
        const on = value === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`px-3 py-1.5 rounded-lg text-xs ${on ? "btn-write" : "btn-metal"}`}
          >
            {MODEL_LABEL[m]}
            {m === "fable" ? " · opt-in" : ""}
            {" · "}
            {n}
          </button>
        );
      })}
    </div>
  );
}
