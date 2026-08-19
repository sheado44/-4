export type PlanId = "free" | "press" | "desk";

export const TIERS: Record<
  PlanId,
  {
    label: string;
    price: number;
    credits: number;
    tools: string;
  }
> = {
  free: {
    label: "Pit Pass",
    price: 0,
    credits: 0,
    tools: "Read, comment, star, theMoshpit. No monthly AI.",
  },
  press: {
    label: "Press",
    price: 12,
    credits: 80,
    tools: "Mid model, mid thumbnails, editor + satire.",
  },
  desk: {
    label: "Desk",
    price: 25,
    credits: 200,
    tools: "Best model, best thumbnails, full editor.",
  },
};

export const CREDIT_COST = {
  text: 1,
  satire: 1,
  image: 4,
} as const;

export function planLabel(plan: string | null | undefined) {
  const p = String(plan || "free").toLowerCase();
  if (p === "desk") return TIERS.desk.label;
  if (p === "press") return TIERS.press.label;
  return TIERS.free.label;
}

export function planAllowance(plan: string | null | undefined) {
  const p = String(plan || "free").toLowerCase();
  if (p === "desk") return TIERS.desk.credits;
  if (p === "press") return TIERS.press.credits;
  return 0;
}

export function normalizePlan(plan: string | null | undefined): PlanId {
  const p = String(plan || "free").toLowerCase();
  if (p === "desk") return "desk";
  if (p === "press") return "press";
  return "free";
}
