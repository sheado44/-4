"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CREDIT_COST, CREDIT_PACKS, TIERS, planAllowance, planLabel, type PlanId } from "@/lib/tiers";
import { applyPlanCharge, buyCreditPack } from "@/lib/aiCredits";

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<PlanId>("free");
  const [allotment, setAllotment] = useState(0);
  const [banked, setBanked] = useState(0);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [confirmPack, setConfirmPack] = useState<(typeof CREDIT_PACKS)[number] | null>(null);

  const load = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, ai_credits, banked_credits, credit_period_end, points")
      .eq("id", user.id)
      .maybeSingle();
    const p = String(profile?.plan || "free").toLowerCase();
    setPlan(p === "desk" ? "desk" : p === "press" ? "press" : "free");
    setAllotment(Number(profile?.ai_credits ?? 0));
    setBanked(Number(profile?.banked_credits ?? 0));
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
    setMessage(
      `${TIERS[next].label} allotment filled with ${TIERS[next].credits}. Banked credits were not touched. Stripe later.`
    );
    load();
  };

  const reload = async () => {
    if (!confirmPack) return;
    setBusy(true);
    setMessage("");
    const res = await buyCreditPack(confirmPack.id);
    setBusy(false);
    setConfirmPack(null);
    if (!res.ok) {
      setMessage(res.reason);
      return;
    }
    setMessage(
      `Banked ${confirmPack.credits} credits. They do not expire. Monthly leftover still does.`
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

  const spendable = allotment + banked;

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold mb-2">theMoneyPit</h1>
      <p className="text-sm text-muted-pit mb-6">
        Monthly allotment expires. Reloads do not. Spend burns allotment first, then banked.
      </p>

      <div className="pit-panel p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Current tier</div>
        <div className="text-2xl font-bold mb-1">{planLabel(plan)}</div>
        <p className="text-sm text-muted-pit mb-4">{TIERS[plan].tools}</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 p-3">
            <div className="text-[11px] text-muted-pit">This month</div>
            <div className="text-2xl font-bold">{allotment}</div>
            <div className="text-[10px] text-muted-pit">/ {planAllowance(plan)} expires</div>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <div className="text-[11px] text-muted-pit">Banked</div>
            <div className="text-2xl font-bold" style={{ color: "#D4A056" }}>
              {banked}
            </div>
            <div className="text-[10px] text-muted-pit">never expire</div>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <div className="text-[11px] text-muted-pit">Can spend</div>
            <div className="text-2xl font-bold">{spendable}</div>
            <div className="text-[10px] text-muted-pit">{points} pts</div>
          </div>
        </div>
        {periodEnd && (
          <p className="text-[11px] text-muted-pit mt-3">
            Allotment ends {new Date(periodEnd).toLocaleDateString()}. Banked stays.
          </p>
        )}
      </div>

      <div className="pit-panel p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[0.16em] mb-2" style={{ color: "#D4A056" }}>
          Reload
        </div>
        <p className="text-sm text-muted-pit mb-3">
          Extra credits if the monthly pile is gone. One tap, then confirm. No refund.
        </p>
        <div className="space-y-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={busy}
              onClick={() => setConfirmPack(pack)}
              className="w-full btn-metal px-4 py-2.5 rounded-xl text-sm disabled:opacity-60 flex items-center justify-between"
            >
              <span>{pack.credits} credits</span>
              <span style={{ color: "#D4A056" }}>${pack.dollars}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-pit mt-2">
          Stripe later. This test banks the credits now so the two piles can be tried.
        </p>
      </div>

      <div className="pit-panel p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">
          What credits buy
        </div>
        <ul className="text-sm space-y-1">
          <li>Editor pass or trashPit = {CREDIT_COST.text} credit</li>
          <li>Any image = {CREDIT_COST.image} credits</li>
          <li>A used credit is gone even if review fails. No refunds.</li>
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
          Press · ${TIERS.press.price} · {TIERS.press.credits} allotment
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => charge("desk")}
          className="w-full btn-write px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
        >
          Desk · ${TIERS.desk.price} · {TIERS.desk.credits} allotment
        </button>
        <p className="text-[11px] text-muted-pit">
          Refill only replaces this month. Banked is not wiped.
        </p>
        {message && <p className="text-sm text-yellow-200">{message}</p>}
      </div>

      <Link href="/" className="text-sm text-highlight-pit">
        ← Home
      </Link>

      {confirmPack && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.62)" }}
          onClick={() => !busy && setConfirmPack(null)}
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
              Reload
            </div>
            <p className="text-lg font-extrabold mb-2" style={{ letterSpacing: "-0.03em" }}>
              <span style={{ color: "#F4F7FB" }}>{confirmPack.credits} credits </span>
              <span style={{ color: "#D4A056" }}>for ${confirmPack.dollars}.</span>
            </p>
            <p className="text-sm text-muted-pit mb-4">
              These do not expire. Monthly leftover still does. No refund. Stripe is not live —
              this test adds the banked pile now.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-metal flex-1 px-3 py-2 rounded-xl text-sm"
                disabled={busy}
                onClick={() => setConfirmPack(null)}
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
                disabled={busy}
                onClick={reload}
              >
                {busy ? "Banking..." : "Confirm reload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
