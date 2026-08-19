"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CREDIT_COST, TIERS, planAllowance, planLabel, type PlanId } from "@/lib/tiers";
import { applyPlanCharge } from "@/lib/aiCredits";

export default function MoneyPitPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<PlanId>("free");
  const [credits, setCredits] = useState(0);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [points, setPoints] = useState(0);

  const load = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, ai_credits, credit_period_end, points")
      .eq("id", user.id)
      .maybeSingle();
    const p = String(profile?.plan || "free").toLowerCase();
    setPlan(p === "desk" ? "desk" : p === "press" ? "press" : "free");
    setCredits(Number(profile?.ai_credits ?? 0));
    setPeriodEnd(profile?.credit_period_end || null);
    setPoints(Number(profile?.points ?? 0));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const on = () => load();
    window.addEventListener("ballpit-wallet-updated", on);
    return () => window.removeEventListener("ballpit-wallet-updated", on);
  }, []);

  const charge = async (next: "press" | "desk") => {
    setBusy(true);
    setMessage("");
    const res = await applyPlanCharge(next);
    setBusy(false);
    if (!res.ok) {
      setMessage(res.reason);
      return;
    }
    setPlan(next);
    setCredits(res.remaining);
    setMessage(
      `${TIERS[next].label} filled with ${TIERS[next].credits} credits. Stripe will replace this test charge.`
    );
    load();
  };

  if (loading) {
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <p className="text-sm text-muted-pit">Loading theMoneyPit...</p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold mb-2">theMoneyPit</h1>
      <p className="text-sm text-muted-pit mb-6">
        Points and AI credits. Charge fills the monthly pile. Tools spend it. Leftover dies at
        the next charge.
      </p>

      <div className="pit-panel p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Current tier</div>
        <div className="text-2xl font-bold mb-1">{planLabel(plan)}</div>
        <p className="text-sm text-muted-pit mb-4">{TIERS[plan].tools}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 p-3">
            <div className="text-xs text-muted-pit">AI credits</div>
            <div className="text-2xl font-bold">
              {credits}
              <span className="text-sm text-muted-pit font-normal">
                {" "}
                / {planAllowance(plan)}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <div className="text-xs text-muted-pit">Points</div>
            <div className="text-2xl font-bold text-highlight-pit">{points}</div>
          </div>
        </div>
        {periodEnd && (
          <p className="text-[11px] text-muted-pit mt-3">
            This pile ends {new Date(periodEnd).toLocaleDateString()}. Next charge refills from
            zero.
          </p>
        )}
      </div>

      <div className="pit-panel p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">
          What credits buy
        </div>
        <ul className="text-sm space-y-1">
          <li>Editor pass or satire = {CREDIT_COST.text} credit</li>
          <li>Any image (inline, thumb, comment) = {CREDIT_COST.image} credits</li>
          <li>A used credit is gone even if the picture fails review. No refunds.</li>
        </ul>
      </div>

      <div className="pit-panel p-5 mb-4 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">
          Monthly charge (test until Stripe)
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => charge("press")}
          className="w-full btn-metal px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
        >
          Press · ${TIERS.press.price} · {TIERS.press.credits} credits
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => charge("desk")}
          className="w-full btn-write px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
        >
          Desk · ${TIERS.desk.price} · {TIERS.desk.credits} credits
        </button>
        <p className="text-[11px] text-muted-pit">
          Test buttons refill now. Real money comes later. Higher tier = better tools and a
          bigger pile.
        </p>
        {message && <p className="text-sm text-muted-pit">{message}</p>}
      </div>

      <Link href="/" className="text-sm text-highlight-pit">
        ← Home
      </Link>
    </main>
  );
}
