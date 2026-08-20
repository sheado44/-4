import { supabase } from "@/lib/supabaseClient";
import { CREDIT_COST } from "@/lib/tiers";

export async function spendAiCredits(cost: number, reason: string) {
  if (cost < 1) return { ok: false, remaining: 0, reason: "Bad cost." };
  const { data, error } = await supabase.rpc("spend_ai_credits", {
    cost,
    reason,
  });
  if (error) {
    const msg = error.message || "Could not spend credits.";
    if (msg.toLowerCase().includes("not enough")) {
      return { ok: false, remaining: 0, reason: "No AI credits left. Reload in theMoneyPit." };
    }
    return { ok: false, remaining: 0, reason: msg };
  }
  window.dispatchEvent(new Event("ballpit-wallet-updated"));
  return { ok: true, remaining: Number(data ?? 0), reason: "" };
}

export async function applyPlanCharge(plan: "press" | "desk") {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, remaining: 0, reason: "Log in first." };
  const { data, error } = await supabase.rpc("apply_plan_charge", {
    target: uid,
    new_plan: plan,
  });
  if (error) return { ok: false, remaining: 0, reason: error.message };
  window.dispatchEvent(new Event("ballpit-wallet-updated"));
  return { ok: true, remaining: Number(data ?? 0), reason: "" };
}

export async function buyCreditPack(pack: "small" | "mid" | "big") {
  const { data, error } = await supabase.rpc("buy_credit_pack", { pack });
  if (error) return { ok: false, banked: 0, reason: error.message };
  window.dispatchEvent(new Event("ballpit-wallet-updated"));
  return { ok: true, banked: Number(data ?? 0), reason: "" };
}

export { CREDIT_COST };
