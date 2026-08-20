export type PlanId = "free" | "press" | "desk";
export type AiModel = "haiku" | "sonnet" | "opus" | "fable";
export type AiJob =
  | "satireLab"
  | "review"
  | "research"
  | "setWeek"
  | "sitResearch"
  | "image"
  | "thumbnail";

export const MODEL_LABEL: Record<AiModel, string> = {
  haiku: "Haiku",
  sonnet: "Sonnet",
  opus: "Opus",
  fable: "Fable",
};

export const JOB_LABEL: Record<AiJob, string> = {
  satireLab: "satireLab",
  review: "Review",
  research: "Research this take",
  setWeek: "Set my week",
  sitResearch: "Start / sit",
  image: "Inline image",
  thumbnail: "Thumbnail",
};

/** null = that model is not offered for this job */
const TABLE: Record<AiJob, Record<AiModel, number | null>> = {
  satireLab: { haiku: 1, sonnet: 2, opus: 5, fable: 12 },
  review: { haiku: 0, sonnet: 0, opus: null, fable: null },
  research: { haiku: 1, sonnet: 2, opus: 5, fable: 12 },
  setWeek: { haiku: 2, sonnet: 4, opus: 8, fable: 16 },
  sitResearch: { haiku: 1, sonnet: 2, opus: 5, fable: null },
  image: { haiku: 4, sonnet: 4, opus: 4, fable: 4 },
  thumbnail: { haiku: 4, sonnet: 4, opus: 4, fable: 4 },
};

export function creditCost(job: AiJob, model: AiModel): number | null {
  return TABLE[job][model];
}

export function modelsForPlan(plan: PlanId): AiModel[] {
  if (plan === "desk") return ["haiku", "sonnet", "opus", "fable"];
  if (plan === "press") return ["haiku", "sonnet"];
  return ["haiku"];
}

export function defaultModel(plan: PlanId): AiModel {
  if (plan === "desk" || plan === "press") return "sonnet";
  return "haiku";
}

export function planAllowsModel(plan: PlanId, model: AiModel) {
  return modelsForPlan(plan).includes(model);
}
