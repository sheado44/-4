"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FantasiDeskMark from "@/components/FantasiDeskMark";
import { supabase } from "@/lib/supabaseClient";
import { spendAiCredits } from "@/lib/aiCredits";
import ComputeButton from "@/components/ComputeButton";
import ModelPicker from "@/components/ModelPicker";
import { creditCost, defaultModel, type AiModel } from "@/lib/creditTable";

type Plan = "free" | "press" | "desk";
type Pos = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DST";
type SlotId = "QB" | "RB1" | "RB2" | "WR1" | "WR2" | "TE" | "FLEX" | "K" | "DST";
type AiId = "setWeek" | "sitResearch" | "waiver" | "matchup" | "trade" | "engine";
type Preset = "standard" | "half" | "ppr" | "custom";
type StatKey =
  | "passYds"
  | "passTD"
  | "int"
  | "rushYds"
  | "rushTD"
  | "recYds"
  | "rec"
  | "recTD"
  | "fum"
  | "twoPt"
  | "fg"
  | "xp"
  | "sack"
  | "dstInt"
  | "dstTd"
  | "pa";

type Scoring = Record<StatKey, { on: boolean; pts: number }>;

type Player = {
  id: string;
  name: string;
  pos: Exclude<Pos, "FLEX">;
  team: string;
  opp: string;
  stats: Partial<Record<StatKey, number>>;
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

const STATS: { key: StatKey; label: string; step: number }[] = [
  { key: "passYds", label: "Passing yards", step: 0.01 },
  { key: "passTD", label: "Passing TD", step: 0.5 },
  { key: "int", label: "INT thrown", step: 0.5 },
  { key: "rushYds", label: "Rush yards", step: 0.01 },
  { key: "rushTD", label: "Rush TD", step: 0.5 },
  { key: "recYds", label: "Rec yards", step: 0.01 },
  { key: "rec", label: "Reception", step: 0.1 },
  { key: "recTD", label: "Rec TD", step: 0.5 },
  { key: "fum", label: "Fumble lost", step: 0.5 },
  { key: "twoPt", label: "2-point", step: 0.5 },
  { key: "fg", label: "FG made", step: 0.5 },
  { key: "xp", label: "XP made", step: 0.5 },
  { key: "sack", label: "DST sack", step: 0.5 },
  { key: "dstInt", label: "DST INT", step: 0.5 },
  { key: "dstTd", label: "DST TD", step: 0.5 },
  { key: "pa", label: "Points allowed (per pt)", step: 0.1 },
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
  setWeek: "free",
  sitResearch: "press",
  waiver: "press",
  matchup: "desk",
  trade: "desk",
  engine: "desk",
};

function baseScoring(rec: number): Scoring {
  return {
    passYds: { on: true, pts: 0.04 },
    passTD: { on: true, pts: 4 },
    int: { on: true, pts: -2 },
    rushYds: { on: true, pts: 0.1 },
    rushTD: { on: true, pts: 6 },
    recYds: { on: true, pts: 0.1 },
    rec: { on: rec > 0, pts: rec },
    recTD: { on: true, pts: 6 },
    fum: { on: true, pts: -2 },
    twoPt: { on: true, pts: 2 },
    fg: { on: true, pts: 3 },
    xp: { on: true, pts: 1 },
    sack: { on: true, pts: 1 },
    dstInt: { on: true, pts: 2 },
    dstTd: { on: true, pts: 6 },
    pa: { on: false, pts: -0.1 },
  };
}

const PLAYERS: Player[] = [
  { id: "1", name: "Patrick Mahomes", pos: "QB", team: "KC", opp: "BUF", stats: { passYds: 285, passTD: 2, int: 1, rushYds: 22, rushTD: 0, fum: 0 } },
  { id: "2", name: "Josh Allen", pos: "QB", team: "BUF", opp: "KC", stats: { passYds: 268, passTD: 2, int: 0, rushYds: 44, rushTD: 1, fum: 0 } },
  { id: "3", name: "Lamar Jackson", pos: "QB", team: "BAL", opp: "CLE", stats: { passYds: 230, passTD: 1, int: 0, rushYds: 68, rushTD: 1, fum: 0 } },
  { id: "4", name: "Christian McCaffrey", pos: "RB", team: "SF", opp: "SEA", stats: { rushYds: 92, rushTD: 1, rec: 6, recYds: 48, recTD: 0, fum: 0 } },
  { id: "5", name: "Breece Hall", pos: "RB", team: "NYJ", opp: "MIA", stats: { rushYds: 78, rushTD: 0, rec: 5, recYds: 36, recTD: 0, fum: 0 } },
  { id: "6", name: "Jahmyr Gibbs", pos: "RB", team: "DET", opp: "GB", stats: { rushYds: 84, rushTD: 1, rec: 4, recYds: 29, recTD: 0, fum: 0 } },
  { id: "7", name: "Derrick Henry", pos: "RB", team: "BAL", opp: "CLE", stats: { rushYds: 105, rushTD: 1, rec: 1, recYds: 8, recTD: 0, fum: 0 } },
  { id: "8", name: "CeeDee Lamb", pos: "WR", team: "DAL", opp: "PHI", stats: { rec: 8, recYds: 98, recTD: 1, rushYds: 6, fum: 0 } },
  { id: "9", name: "Justin Jefferson", pos: "WR", team: "MIN", opp: "CHI", stats: { rec: 7, recYds: 112, recTD: 1, fum: 0 } },
  { id: "10", name: "Amon-Ra St. Brown", pos: "WR", team: "DET", opp: "GB", stats: { rec: 9, recYds: 86, recTD: 0, fum: 0 } },
  { id: "11", name: "Tyreek Hill", pos: "WR", team: "MIA", opp: "NYJ", stats: { rec: 5, recYds: 74, recTD: 1, rushYds: 12, fum: 0 } },
  { id: "12", name: "Travis Kelce", pos: "TE", team: "KC", opp: "BUF", stats: { rec: 6, recYds: 72, recTD: 1, fum: 0 } },
  { id: "13", name: "Trey McBride", pos: "TE", team: "ARI", opp: "LAR", stats: { rec: 7, recYds: 68, recTD: 0, fum: 0 } },
  { id: "14", name: "George Kittle", pos: "TE", team: "SF", opp: "SEA", stats: { rec: 5, recYds: 61, recTD: 1, fum: 0 } },
  { id: "15", name: "Harrison Butker", pos: "K", team: "KC", opp: "BUF", stats: { fg: 2, xp: 3 } },
  { id: "16", name: "Bills DST", pos: "DST", team: "BUF", opp: "KC", stats: { sack: 3, dstInt: 1, dstTd: 0, pa: 20 } },
];

function allowed(plan: Plan, need: Plan) {
  if (need === "press") return plan === "press" || plan === "desk";
  return plan === "desk";
}

function fits(player: Player, slotPos: Pos) {
  if (slotPos === "FLEX") return player.pos === "RB" || player.pos === "WR" || player.pos === "TE";
  return player.pos === slotPos;
}

function emptyRoster(): Record<SlotId, string> {
  return { QB: "", RB1: "", RB2: "", WR1: "", WR2: "", TE: "", FLEX: "", K: "", DST: "" };
}

function scorePlayer(p: Player, scoring: Scoring) {
  let n = 0;
  (Object.keys(scoring) as StatKey[]).forEach((k) => {
    const rule = scoring[k];
    if (!rule.on) return;
    n += (p.stats[k] || 0) * rule.pts;
  });
  return Math.round(n * 10) / 10;
}

export default function FantasyPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [model, setModel] = useState<AiModel>("haiku");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("ppr");
  const [scoring, setScoring] = useState<Scoring>(() => baseScoring(1));
  const [showRules, setShowRules] = useState(false);
  const [roster, setRoster] = useState<Record<SlotId, string>>(emptyRoster);
  const [sitA, setSitA] = useState("4");
  const [sitB, setSitB] = useState("6");
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
      setModel(defaultModel(p === "desk" ? "desk" : p === "press" ? "press" : "free"));
      setCredits(Number(profile?.ai_credits ?? 0));
      setLoading(false);
    };
    boot();
  }, []);

  const applyPreset = (id: Preset) => {
    setPreset(id);
    if (id === "standard") setScoring(baseScoring(0));
    if (id === "half") setScoring(baseScoring(0.5));
    if (id === "ppr") setScoring(baseScoring(1));
  };

  const editRule = (key: StatKey, patch: Partial<Scoring[StatKey]>) => {
    setPreset("custom");
    setScoring((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const ranked = useMemo(
    () =>
      [...PLAYERS]
        .map((p) => ({ ...p, adj: scorePlayer(p, scoring) }))
        .sort((a, b) => b.adj - a.adj),
    [scoring]
  );

  const used = new Set(Object.values(roster).filter(Boolean));
  const rosterTotal = SLOTS.reduce((s, slot) => {
    const p = ranked.find((x) => x.id === roster[slot.id]);
    return s + (p?.adj || 0);
  }, 0);

  const a = ranked.find((p) => p.id === sitA);
  const b = ranked.find((p) => p.id === sitB);
  const sitWinner = a && b ? (a.adj >= b.adj ? a : b) : null;
  const sitLoser = a && b && sitWinner ? (sitWinner.id === a.id ? b : a) : null;

  const fillBest = () => {
    const taken = new Set<string>();
    const next = emptyRoster();
    for (const slot of SLOTS) {
      const pick = ranked.find((p) => fits(p, slot.pos) && !taken.has(p.id));
      next[slot.id] = pick?.id || "";
      if (pick) taken.add(pick.id);
    }
    setRoster(next);
    setMessage("Best available under this scoring. Free.");
  };

  const runAi = async (id: AiId, title: string, text: string, after?: () => void) => {
    setMessage("");
    if (!userId) return;
    if (!allowed(plan, NEED[id])) {
      setMessage(NEED[id] === "desk" ? "Desk research." : "Press or Desk research.");
      return;
    }
    const mapped = id === "setWeek" || id === "sitResearch" ? id : null;
    const cost = mapped ? creditCost(mapped, model) ?? COST[id] : COST[id];
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
    const taken = new Set<string>();
    const next = emptyRoster();
    const notes: string[] = [];
    for (const slot of SLOTS) {
      const pool = ranked.filter((p) => fits(p, slot.pos) && !taken.has(p.id));
      const pick = pool[0];
      next[slot.id] = pick?.id || "";
      if (pick) {
        taken.add(pick.id);
        notes.push(`${slot.label}: ${pick.name} · ${pick.adj.toFixed(1)}`);
      }
    }
    runAi(
      "setWeek",
      "Set my week",
      `Locked under ${preset.toUpperCase()} scoring.\n\n${notes.join("\n")}`,
      () => setRoster(next)
    );
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-muted-pit">Loading fantasiDesk...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold mb-2">
          <FantasiDeskMark />
        </h1>
        <p className="text-sm text-muted-pit mb-5">A product of theBallpit.</p>
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
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-pit">a product of theBallpit</div>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            <FantasiDeskMark />
          </h1>
          <p className="text-sm text-muted-pit mt-1">
            Scoring is yours. Board and standings follow the table. Same login, same credits.
          </p>
          <Link href="/fantasy/golf" className="text-xs text-highlight-pit">
            Golf card →
          </Link>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{credits}</div>
          <div className="text-[11px] text-muted-pit">AI credits</div>
        </div>
      </div>

      <div className="pit-panel p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Busy?</div>
            <div className="font-semibold">Set my week</div>
          </div>
          {!allowed(plan, NEED.setWeek) ? (
            <button type="button" disabled className="btn-metal px-5 py-3 rounded-xl text-sm opacity-45">
              Press 🔒
            </button>
          ) : (
            <div>
              <ModelPicker plan={plan} job="setWeek" value={model} onChange={setModel} />
              <ComputeButton
                job="setWeek"
                model={model}
                label="Set my week"
                busy={busy === "setWeek"}
                onConfirm={setMyWeek}
              />
            </div>
          )}
        </div>
      </div>

      <div className="pit-panel p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Scoring · free</div>
            <div className="text-xs text-muted-pit">Presets or open the table and write your own league.</div>
          </div>
          <button type="button" onClick={() => setShowRules((v) => !v)} className="btn-metal px-3 py-1.5 rounded-lg text-xs">
            {showRules ? "Hide table" : "Edit stats"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["standard", "Standard"],
              ["half", "Half PPR"],
              ["ppr", "Full PPR"],
              ["custom", "Custom"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => applyPreset(id)}
              className={`px-4 py-2 rounded-xl text-sm ${preset === id ? "btn-write" : "btn-metal"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {showRules && (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted-pit text-left">
                  <th className="py-2 pr-2">Track</th>
                  <th className="py-2 pr-2">Stat</th>
                  <th className="py-2">Points each</th>
                </tr>
              </thead>
              <tbody>
                {STATS.map((s) => (
                  <tr key={s.key} className="border-t border-white/5">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={scoring[s.key].on}
                        onChange={(e) => editRule(s.key, { on: e.target.checked })}
                      />
                    </td>
                    <td className="py-2 pr-2">{s.label}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        step={s.step}
                        value={scoring[s.key].pts}
                        onChange={(e) => editRule(s.key, { pts: Number(e.target.value) })}
                        className="w-24 rounded-lg px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4">
          <div className="pit-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Board</h2>
              <span className="text-[10px] uppercase text-muted-pit">{preset}</span>
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
                <p className="text-xs text-muted-pit">{rosterTotal.toFixed(1)} under this table</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={fillBest} className="btn-metal px-3 py-1.5 rounded-lg text-xs">
                  Best available
                </button>
                <button type="button" onClick={() => setRoster(emptyRoster())} className="btn-metal px-3 py-1.5 rounded-lg text-xs">
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
                    onChange={(e) => setRoster((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">Empty</option>
                    {ranked
                      .filter((p) => fits(p, slot.pos) && (!used.has(p.id) || roster[slot.id] === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.adj.toFixed(1)}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="pit-panel p-4">
            <h3 className="font-semibold">Start / Sit</h3>
            <p className="text-xs text-muted-pit mb-3">Uses your table. Free.</p>
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
              cost={1}
              need="Press"
              locked={!allowed(plan, "press")}
              busy={busy === "sitResearch"}
              onClick={() => {
                if (!sitWinner || !sitLoser) return;
                runAi("sitResearch", "Start / Sit research · 1", `Under this scoring, start ${sitWinner.name}.`);
              }}
            />
          </div>

          {output && (
            <div className="pit-panel p-5">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">{outputTitle}</div>
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
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm">
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
  if (locked) {
    return (
      <button type="button" disabled className="btn-metal w-full px-4 py-2.5 rounded-xl text-sm opacity-45">
        {need} 🔒
      </button>
    );
  }
  return (
    <ComputeButton
      cost={cost}
      label={label}
      busy={busy}
      onConfirm={onClick}
    />
  );
}


