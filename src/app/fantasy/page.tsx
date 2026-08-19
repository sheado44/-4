"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { spendAiCredits } from "@/lib/aiCredits";

type Plan = "free" | "press" | "desk";
type Scoring = "standard" | "half" | "ppr";
type Pos = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DST";
type SlotId = "QB" | "RB1" | "RB2" | "WR1" | "WR2" | "TE" | "FLEX" | "K" | "DST";
type AiId = "setWeek" | "sitResearch" | "waiver" | "matchup" | "trade" | "engine";

type Player = {
  id: string;
  name: string;
  pos: Exclude<Pos, "FLEX">;
  team: string;
  opp: string;
  proj: number;
};

const SLOTS: { id: SlotId; pos: Pos; label: string }[] = [
  { id: "QB", pos: "QB", label: "QB" },
  { id: "RB1", pos: "RB", label: "RB" },
  { id: "RB2", pos: "RB", label: "RB" },
  { id: "WR1", pos: "WR", label: "WR" },
  { id: "WR2", pos: "WR", label: "WR" },
  { id: "TE", pos: "TE", label: "TE" },
  { id: "FLEX", pos: "FLEX", label: "FLEX" },
  { id: "K", pos: "K", label: "K" },
  { id: "DST", pos: "DST", label: "DST" },
];

const COST: Record<AiId, number> = {
  setWeek: 5,
  sitResearch: 1,
  waiver: 2,
  matchup: 4,
  trade: 8,
  engine: 8,
};

const NEED: Record<AiId, Plan> = {
  setWeek: "press",
  sitResearch: "press",
  waiver: "press",
  matchup: "desk",
  trade: "desk",
  engine: "desk",
};

const PLAYERS: Player[] = [
  { id: "1", name: "Patrick Mahomes", pos: "QB", team: "KC", opp: "BUF", proj: 22.4 },
  { id: "2", name: "Josh Allen", pos: "QB", team: "BUF", opp: "KC", proj: 23.1 },
  { id: "3", name: "Lamar Jackson", pos: "QB", team: "BAL", opp: "CLE", proj: 21.8 },
  { id: "4", name: "Christian McCaffrey", pos: "RB", team: "SF", opp: "SEA", proj: 21.2 },
  { id: "5", name: "Breece Hall", pos: "RB", team: "NYJ", opp: "MIA", proj: 16.4 },
  { id: "6", name: "Jahmyr Gibbs", pos: "RB", team: "DET", opp: "GB", proj: 17.1 },
  { id: "7", name: "Derrick Henry", pos: "RB", team: "BAL", opp: "CLE", proj: 15.8 },
  { id: "8", name: "CeeDee Lamb", pos: "WR", team: "DAL", opp: "PHI", proj: 16.9 },
  { id: "9", name: "Justin Jefferson", pos: "WR", team: "MIN", opp: "CHI", proj: 17.6 },
  { id: "10", name: "Amon-Ra St. Brown", pos: "WR", team: "DET", opp: "GB", proj: 15.4 },
  { id: "11", name: "Tyreek Hill", pos: "WR", team: "MIA", opp: "NYJ", proj: 14.8 },
  { id: "12", name: "Travis Kelce", pos: "TE", team: "KC", opp: "BUF", proj: 13.2 },
  { id: "13", name: "Trey McBride", pos: "TE", team: "ARI", opp: "LAR", proj: 12.4 },
  { id: "14", name: "George Kittle", pos: "TE", team: "SF", opp: "SEA", proj: 11.7 },
  { id: "15", name: "Harrison Butker", pos: "K", team: "KC", opp: "BUF", proj: 8.4 },
  { id: "16", name: "Bills DST", pos: "DST", team: "BUF", opp: "KC", proj: 7.1 },
];

function allowed(plan: Plan, need: Plan) {
  if (need === "press") return plan === "press" || plan === "desk";
  return plan === "desk";
}

function bump(s: Scoring, pos: Player["pos"]) {
  if (pos !== "WR" && pos !== "RB" && pos !== "TE") return 0;
  if (s === "ppr") return 3.2;
  if (s === "half") return 1.6;
  return 0;
}

function fits(player: Player, slotPos: Pos) {
  if (slotPos === "FLEX") return player.pos === "RB" || player.pos === "WR" || player.pos === "TE";
  return player.pos === slotPos;
}

function emptyRoster(): Record<SlotId, string> {
  return {
    QB: "",
    RB1: "",
    RB2: "",
    WR1: "",
    WR2: "",
    TE: "",
    FLEX: "",
    K: "",
    DST: "",
  };
}

export default function FantasyPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState<Scoring>("ppr");
  const [roster, setRoster] = useState<Record<SlotId, string>>(emptyRoster);
  const [sitA, setSitA] = useState("4");
  const [sitB, setSitB] = useState("6");
  const [waiverPos, setWaiverPos] = useState<Player["pos"]>("RB");
  const [matchTeam, setMatchTeam] = useState("KC");
  const [give, setGive] = useState("11");
  const [get, setGet] = useState("5");
  const [busy, setBusy] = useState<AiId | null>(null);
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("");
  const [outputTitle, setOutputTitle] = useState("");

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
        .select("plan, ai_credits")
        .eq("id", user.id)
        .maybeSingle();
      const p = String(profile?.plan || "free").toLowerCase();
      setPlan(p === "desk" ? "desk" : p === "press" ? "press" : "free");
      setCredits(Number(profile?.ai_credits ?? 0));
      setLoading(false);
    };
    boot();
  }, []);

  const ranked = useMemo(
    () =>
      [...PLAYERS]
        .map((p) => ({ ...p, adj: +(p.proj + bump(scoring, p.pos)).toFixed(1) }))
        .sort((a, b) => b.adj - a.adj),
    [scoring]
  );

  const used = new Set(Object.values(roster).filter(Boolean));

  const setSlot = (slot: SlotId, id: string) => {
    setRoster((prev) => ({ ...prev, [slot]: id }));
  };

  const fillBest = () => {
    const taken = new Set<string>();
    const next = emptyRoster();
    for (const slot of SLOTS) {
      const pick = ranked.find((p) => fits(p, slot.pos) && !taken.has(p.id));
      next[slot.id] = pick?.id || "";
      if (pick) taken.add(pick.id);
    }
    setRoster(next);
    setMessage("Best available from the stub board. Free. No credit.");
  };

  const buildWeekLineup = () => {
    const taken = new Set<string>();
    const next = emptyRoster();
    const notes: string[] = [];
    for (const slot of SLOTS) {
      const pool = ranked.filter((p) => fits(p, slot.pos) && !taken.has(p.id));
      let pick = pool[0];
      if (slot.pos === "QB" || slot.id === "FLEX") {
        const stacked = pool.find((p) =>
          [...taken].some((id) => ranked.find((x) => x.id === id)?.team === p.team)
        );
        if (stacked && stacked.adj >= (pick?.adj || 0) - 2) pick = stacked;
      }
      next[slot.id] = pick?.id || "";
      if (pick) {
        taken.add(pick.id);
        notes.push(`${slot.label}: ${pick.name} vs ${pick.opp} · ${pick.adj.toFixed(1)}`);
      }
    }
    return { next, notes };
  };

  const rosterTotal = SLOTS.reduce((s, slot) => {
    const p = ranked.find((x) => x.id === roster[slot.id]);
    return s + (p?.adj || 0);
  }, 0);

  const a = ranked.find((p) => p.id === sitA);
  const b = ranked.find((p) => p.id === sitB);
  const sitWinner = a && b ? (a.adj >= b.adj ? a : b) : null;
  const sitLoser = a && b && sitWinner ? (sitWinner.id === a.id ? b : a) : null;

  const runAi = async (id: AiId, title: string, text: string, after?: () => void) => {
    setMessage("");
    if (!userId) {
      setMessage("Log in first.");
      return;
    }
    if (!allowed(plan, NEED[id])) {
      setMessage(NEED[id] === "desk" ? "Desk research." : "Press or Desk research.");
      return;
    }
    const cost = COST[id];
    if (credits < cost) {
      setMessage(`Need ${cost} credits. Open theMoneyPit.`);
      return;
    }
    setBusy(id);
    const spend = await spendAiCredits(cost, `fantasy-${id}`);
    if (!spend.ok) {
      setMessage(spend.reason);
      setBusy(null);
      return;
    }
    setCredits(spend.remaining);
    after?.();
    setOutputTitle(title);
    setOutput(text);
    setBusy(null);
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
  };

  const setMyWeek = () => {
    const { next, notes } = buildWeekLineup();
    const total = SLOTS.reduce((s, slot) => {
      const p = ranked.find((x) => x.id === next[slot.id]);
      return s + (p?.adj || 0);
    }, 0);
    runAi(
      "setWeek",
      "Set my week · 5 credits",
      `Lineup locked for this stub week in ${scoring.toUpperCase()}.\n\n` +
        notes.join("\n") +
        `\n\nProjected ${total.toFixed(1)}.\nBusy-manager pass: slots filled, one stack lean if it was close.\nBest available is still free if you only want a sort.`,
      () => setRoster(next)
    );
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-muted-pit">Loading Fantasy desk...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold mb-2">Fantasy</h1>
        <p className="text-sm text-muted-pit mb-4">
          You need a theBallpit account to use the Fantasy desk.
        </p>
        <Link href="/login" className="btn-write inline-block px-5 py-2.5 rounded-xl text-sm">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-pit">theBallpit</div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Fantasy desk</h1>
          <p className="text-sm text-muted-pit mt-1">
            Roster tools are free. Credits buy the week set and the research.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{credits}</div>
          <div className="text-[11px] text-muted-pit">AI credits</div>
          <Link href="/moneypit" className="text-xs text-highlight-pit">
            theMoneyPit
          </Link>
        </div>
      </div>

      <div className="pit-panel p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Busy?</div>
            <div className="font-semibold">Set my week</div>
            <p className="text-xs text-muted-pit">
              One tap fills every slot for this week and explains it. Press+.
            </p>
          </div>
          <button
            type="button"
            onClick={setMyWeek}
            disabled={!allowed(plan, NEED.setWeek) || busy === "setWeek"}
            className="btn-write px-5 py-3 rounded-xl text-sm disabled:opacity-45"
          >
            {!allowed(plan, NEED.setWeek)
              ? "Press 🔒"
              : busy === "setWeek"
              ? "Setting week..."
              : "Set my week · 5"}
          </button>
        </div>
      </div>

      <div className="pit-panel p-4 mb-6">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-3">
          Scoring · free
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["standard", "Standard"],
              ["half", "Half PPR"],
              ["ppr", "Full PPR"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScoring(id)}
              className={`px-4 py-2 rounded-xl text-sm ${scoring === id ? "btn-write" : "btn-metal"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 space-y-4">
          <div className="pit-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Board</h2>
              <span className="text-[10px] uppercase text-muted-pit">free</span>
            </div>
            <div className="space-y-1 max-h-[560px] overflow-auto pr-1">
              {ranked.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 border border-white/5"
                  style={{
                    background: used.has(p.id) ? "rgba(240,160,75,0.12)" : "rgba(0,0,0,0.16)",
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      <span className="text-muted-pit mr-1">{i + 1}</span>
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted-pit">
                      {p.pos} · {p.team} vs {p.opp}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-highlight-pit tabular-nums">
                    {p.adj.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-4">
          <div className="pit-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-semibold">Roster</h2>
                <p className="text-xs text-muted-pit">
                  Standard slots. Unlimited. {rosterTotal.toFixed(1)} {scoring.toUpperCase()}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={fillBest} className="btn-metal px-3 py-1.5 rounded-lg text-xs">
                  Best available
                </button>
                <button
                  type="button"
                  onClick={() => setRoster(emptyRoster())}
                  className="btn-metal px-3 py-1.5 rounded-lg text-xs"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {SLOTS.map((slot) => (
                <div key={slot.id} className="grid grid-cols-[52px_1fr] gap-2 items-center">
                  <div className="text-xs font-semibold text-muted-pit">{slot.label}</div>
                  <select
                    value={roster[slot.id]}
                    onChange={(e) => setSlot(slot.id, e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">Empty</option>
                    {ranked
                      .filter((p) => fits(p, slot.pos) && (!used.has(p.id) || roster[slot.id] === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.team} · {p.adj.toFixed(1)}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="pit-panel p-4">
            <h3 className="font-semibold">Start / Sit</h3>
            <p className="text-xs text-muted-pit mb-3">Higher board number wins. Free.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <PlayerSelect value={sitA} onChange={setSitA} ranked={ranked} />
              <PlayerSelect value={sitB} onChange={setSitB} ranked={ranked} />
            </div>
            {sitWinner && sitLoser && (
              <div className="rounded-xl border border-white/10 px-3 py-2 mb-3 text-sm">
                Start <span className="font-semibold text-highlight-pit">{sitWinner.name}</span>{" "}
                ({sitWinner.adj.toFixed(1)}) · sit {sitLoser.name} ({sitLoser.adj.toFixed(1)})
              </div>
            )}
            <AiButton
              label="Research this call"
              cost={COST.sitResearch}
              need="Press"
              locked={!allowed(plan, NEED.sitResearch)}
              busy={busy === "sitResearch"}
              onClick={() => {
                if (!a || !b || !sitWinner || !sitLoser) return;
                runAi(
                  "sitResearch",
                  "Start / Sit research · 1 credit",
                  `Board says start ${sitWinner.name}.\n\n${sitWinner.name} vs ${sitWinner.opp} is the cleaner role. ${sitLoser.name} is the ceiling chase.\n\nWriteup is paid. The compare above is free.`
                );
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pit-panel p-4">
              <h3 className="font-semibold">Waiver intel</h3>
              <p className="text-xs text-muted-pit mb-3">Not just the top proj. Press+.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(["QB", "RB", "WR", "TE"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setWaiverPos(pos)}
                    className={`px-3 py-1.5 rounded-lg text-xs ${
                      waiverPos === pos ? "btn-write" : "btn-metal"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              <AiButton
                label="Pull waiver brief"
                cost={COST.waiver}
                need="Press"
                locked={!allowed(plan, NEED.waiver)}
                busy={busy === "waiver"}
                onClick={() => {
                  const list = ranked.filter((p) => p.pos === waiverPos).slice(0, 3);
                  runAi(
                    "waiver",
                    "Waiver intel · 2 credits",
                    list
                      .map((p, i) => `${i + 1}. ${p.name} — add if you need ${p.pos} vs ${p.opp}.`)
                      .join("\n") + "\n\nResearch layer. Sorting the board is free."
                  );
                }}
              />
            </div>

            <div className="pit-panel p-4">
              <h3 className="font-semibold">Matchup writeup</h3>
              <p className="text-xs text-muted-pit mb-3">Narrative. Desk.</p>
              <select
                value={matchTeam}
                onChange={(e) => setMatchTeam(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm mb-3"
              >
                {[...new Set(PLAYERS.map((p) => p.team))].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <AiButton
                label="Write the matchup"
                cost={COST.matchup}
                need="Desk"
                locked={!allowed(plan, NEED.matchup)}
                busy={busy === "matchup"}
                onClick={() => {
                  const mine = ranked.filter((p) => p.team === matchTeam);
                  runAi(
                    "matchup",
                    "Matchup writeup · 4 credits",
                    `${matchTeam} this stub week.\n\n` +
                      mine.map((p) => `${p.name} vs ${p.opp}.`).join("\n")
                  );
                }}
              />
            </div>

            <div className="pit-panel p-4">
              <h3 className="font-semibold">Trade intel</h3>
              <p className="text-xs text-muted-pit mb-3">Rest-of-season. Desk.</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-[11px] text-muted-pit mb-1">Give</div>
                  <PlayerSelect value={give} onChange={setGive} ranked={ranked} />
                </div>
                <div>
                  <div className="text-[11px] text-muted-pit mb-1">Get</div>
                  <PlayerSelect value={get} onChange={setGet} ranked={ranked} />
                </div>
              </div>
              <AiButton
                label="Analyze trade"
                cost={COST.trade}
                need="Desk"
                locked={!allowed(plan, NEED.trade)}
                busy={busy === "trade"}
                onClick={() => {
                  const g = ranked.find((p) => p.id === give);
                  const t = ranked.find((p) => p.id === get);
                  if (!g || !t || g.id === t.id) {
                    setMessage("Pick two different players.");
                    return;
                  }
                  runAi(
                    "trade",
                    "Trade intel · 8 credits",
                    `Give ${g.name} for ${t.name}.\n` +
                      (t.adj >= g.adj ? `Take ${t.name}.` : `Keep ${g.name}.`)
                  );
                }}
              />
            </div>

            <div className="pit-panel p-4">
              <h3 className="font-semibold">Pit engine</h3>
              <p className="text-xs text-muted-pit mb-3">Stacks. Not a sort. Desk.</p>
              <AiButton
                label="Run engine"
                cost={COST.engine}
                need="Desk"
                locked={!allowed(plan, NEED.engine)}
                busy={busy === "engine"}
                onClick={() => {
                  const qb = ranked.find((p) => p.pos === "QB");
                  const stack = ranked.find((p) => p.team === qb?.team && p.pos !== "QB");
                  runAi(
                    "engine",
                    "Pit engine · 8 credits",
                    `Build around ${qb?.name || "your QB"}.` +
                      (stack ? ` Stack ${stack.name}.` : "") +
                      `\nSet my week is the busy button. This is the nerd button.`
                  );
                }}
              />
            </div>
          </div>

          {output && (
            <div className="pit-panel p-5">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">
                {outputTitle}
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
            </div>
          )}
          {message && <p className="text-sm text-yellow-500">{message}</p>}
        </section>
      </div>
    </main>
  );
}

function PlayerSelect({
  value,
  onChange,
  ranked,
}: {
  value: string;
  onChange: (v: string) => void;
  ranked: (Player & { adj: number })[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2 text-sm"
    >
      {ranked.map((p) => (
        <option key={p.id} value={p.id}>
          {p.pos} {p.name} · {p.adj.toFixed(1)}
        </option>
      ))}
    </select>
  );
}

function AiButton({
  label,
  cost,
  need,
  locked,
  busy,
  onClick,
}: {
  label: string;
  cost: number;
  need: string;
  locked: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked || busy}
      className="btn-write w-full px-4 py-2.5 rounded-xl text-sm disabled:opacity-45"
    >
      {locked ? `${need} 🔒` : busy ? "Spending..." : `${label} · ${cost}`}
    </button>
  );
}
