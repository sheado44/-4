"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { spendAiCredits } from "@/lib/aiCredits";

type Plan = "free" | "press" | "desk";

type Golfer = {
  id: string;
  name: string;
  country: string;
  rank: number;
  purse: number;
  note: string;
};

const FIELD: Golfer[] = [
  { id: "1", name: "Scottie Scheffler", country: "USA", rank: 1, purse: 3600000, note: "chalk" },
  { id: "2", name: "Rory McIlroy", country: "NIR", rank: 2, purse: 2180000, note: "ceiling" },
  { id: "3", name: "Xander Schauffele", country: "USA", rank: 3, purse: 1450000, note: "iron play" },
  { id: "4", name: "Ludvig Åberg", country: "SWE", rank: 4, purse: 980000, note: "length" },
  { id: "5", name: "Collin Morikawa", country: "USA", rank: 5, purse: 875000, note: "ball-strike" },
  { id: "6", name: "Viktor Hovland", country: "NOR", rank: 6, purse: 720000, note: "volatile" },
  { id: "7", name: "Wyndham Clark", country: "USA", rank: 8, purse: 545000, note: "bomber" },
  { id: "8", name: "Tommy Fleetwood", country: "ENG", rank: 9, purse: 490000, note: "links lean" },
  { id: "9", name: "Hideki Matsuyama", country: "JPN", rank: 10, purse: 430000, note: "grinder" },
  { id: "10", name: "Patrick Cantlay", country: "USA", rank: 11, purse: 385000, note: "slow burn" },
  { id: "11", name: "Shane Lowry", country: "IRL", rank: 14, purse: 310000, note: "wind" },
  { id: "12", name: "Sahith Theegala", country: "USA", rank: 16, purse: 265000, note: "value" },
  { id: "13", name: "Max Homa", country: "USA", rank: 18, purse: 220000, note: "form dip" },
  { id: "14", name: "Tony Finau", country: "USA", rank: 20, purse: 185000, note: "value" },
  { id: "15", name: "Sungjae Im", country: "KOR", rank: 22, purse: 155000, note: "fairways" },
  { id: "16", name: "Brian Harman", country: "USA", rank: 28, purse: 98000, note: "short-game" },
];

const RIVALS = [
  { name: "DeskBot", ids: ["1", "5", "12"] },
  { name: "theMoshpit", ids: ["2", "8", "11"] },
  { name: "Guest 4401", ids: ["4", "7", "14"] },
];

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function teamPurse(ids: string[]) {
  return ids.reduce((s, id) => s + (FIELD.find((g) => g.id === id)?.purse || 0), 0);
}

export default function GolfFantasyPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("You");
  const [plan, setPlan] = useState<Plan>("free");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [intel, setIntel] = useState("");

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, ai_credits, display_name")
        .eq("id", user.id)
        .maybeSingle();
      const p = String(profile?.plan || "free").toLowerCase();
      setPlan(p === "desk" ? "desk" : p === "press" ? "press" : "free");
      setCredits(Number(profile?.ai_credits ?? 0));
      setDisplayName(profile?.display_name || "You");
      setLoading(false);
    };
    boot();
  }, []);

  const toggle = (id: string) => {
    if (locked) return;
    setPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const myPurse = teamPurse(picks);
  const board = useMemo(() => {
    const rows = [
      { name: displayName, ids: picks, you: true },
      ...RIVALS.map((r) => ({ ...r, you: false })),
    ]
      .map((r) => ({ ...r, purse: teamPurse(r.ids) }))
      .sort((a, b) => b.purse - a.purse);
    return rows;
  }, [picks, displayName]);

  const pickMyThree = async () => {
    setMessage("");
    if (!userId) return;
    if (plan === "free") {
      setMessage("Press or Desk research.");
      return;
    }
    if (credits < 3) {
      setMessage("Need 3 credits. Open theMoneyPit.");
      return;
    }
    setBusy(true);
    const spend = await spendAiCredits(3, "fantasy-golf-three");
    if (!spend.ok) {
      setMessage(spend.reason);
      setBusy(false);
      return;
    }
    setCredits(spend.remaining);
    const value = FIELD.filter((g) => g.rank >= 12).slice(0, 2);
    const chalk = FIELD[0];
    const auto = [chalk.id, value[0].id, value[1].id];
    setPicks(auto);
    setLocked(false);
    setIntel(
      `Set your 3 for this stub purse week.\n\n${chalk.name} is the floor. ${value[0].name} and ${value[1].name} are the value pair so the card is not three #1s.\n\nYou can still swap before lock. 3 credits. No refund.`
    );
    setBusy(false);
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-sm text-muted-pit">Loading golf card...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold mb-2">Golf card</h1>
        <p className="text-sm text-muted-pit mb-3">fantasiDesk is a product of theBallpit.</p>
        <p className="text-sm text-muted-pit mb-4">Log in to pick three.</p>
        <Link href="/login" className="btn-write inline-block px-5 py-2.5 rounded-xl text-sm">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <Link href="/fantasy" className="text-xs text-muted-pit hover:text-highlight-pit">
            ← fantasiDesk
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Golf card</h1>
          <p className="text-sm text-muted-pit mt-1">
            A product of theBallpit. Pick 3. Combined TOUR prize money is the score. Stub week · no cash pot.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{credits}</div>
          <div className="text-[11px] text-muted-pit">AI credits</div>
        </div>
      </div>

      <div className="pit-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">This week</div>
          <div className="font-semibold">Stub event · 3-man purse</div>
          <p className="text-xs text-muted-pit">
            {picks.length}/3 selected · {money(myPurse)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pickMyThree}
            disabled={busy || plan === "free"}
            className="btn-write px-4 py-2.5 rounded-xl text-sm disabled:opacity-45"
          >
            {plan === "free" ? "Press 🔒" : busy ? "Picking..." : "Pick my 3 · 3"}
          </button>
          <button
            type="button"
            onClick={() => setLocked(true)}
            disabled={picks.length !== 3 || locked}
            className="btn-metal px-4 py-2.5 rounded-xl text-sm disabled:opacity-45"
          >
            {locked ? "Locked" : "Lock card"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7">
          <div className="pit-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Field</h2>
              <span className="text-[10px] uppercase text-muted-pit">tap 3 · free</span>
            </div>
            <div className="space-y-1">
              {FIELD.map((g) => {
                const on = picks.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(g.id)}
                    disabled={locked || (!on && picks.length >= 3)}
                    className="w-full text-left flex items-center justify-between gap-3 rounded-lg px-3 py-2 border border-white/5 disabled:opacity-40"
                    style={{
                      background: on ? "rgba(240,160,75,0.16)" : "rgba(0,0,0,0.16)",
                    }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        #{g.rank} {g.name}
                      </div>
                      <div className="text-[11px] text-muted-pit">
                        {g.country} · {g.note}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-highlight-pit tabular-nums">
                      {money(g.purse)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 space-y-4">
          <div className="pit-panel p-4">
            <h2 className="font-semibold mb-1">Your 3</h2>
            {picks.length === 0 ? (
              <p className="text-sm text-muted-pit">Tap three names. Unlimited until you lock.</p>
            ) : (
              <div className="space-y-2">
                {picks.map((id) => {
                  const g = FIELD.find((x) => x.id === id);
                  if (!g) return null;
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span>{g.name}</span>
                      <span className="text-highlight-pit">{money(g.purse)}</span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-white/10 flex justify-between font-semibold">
                  <span>Combined purse</span>
                  <span className="text-highlight-pit">{money(myPurse)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pit-panel p-4">
            <h2 className="font-semibold mb-3">Week board</h2>
            <div className="space-y-2">
              {board.map((row, i) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between text-sm rounded-lg px-2.5 py-1.5"
                  style={{
                    background: row.you ? "rgba(240,160,75,0.12)" : "transparent",
                  }}
                >
                  <span>
                    {i + 1}. {row.name}
                    {row.you ? " · you" : ""}
                  </span>
                  <span className="tabular-nums text-highlight-pit">{money(row.purse)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-pit mt-3">
              Stub rivals. Live week will use real PGA payouts after the final putt.
            </p>
          </div>

          {intel && (
            <div className="pit-panel p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">
                Card research · 3 credits
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{intel}</pre>
            </div>
          )}
          {message && <p className="text-sm text-yellow-500">{message}</p>}
        </section>
      </div>
    </main>
  );
}

