"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { spendAiCredits } from "@/lib/aiCredits";

type Plan = "free" | "press" | "desk";
type Scoring = "standard" | "half" | "ppr";
type ToolId = "startSit" | "waiver" | "matchup" | "trade" | "optimize";

type Player = {
  id: string;
  name: string;
  pos: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
  team: string;
  opp: string;
  proj: number;
};

const COST: Record<ToolId, number> = {
  startSit: 1,
  waiver: 2,
  matchup: 4,
  trade: 8,
  optimize: 8,
};

const NEED: Record<ToolId, Plan> = {
  startSit: "press",
  waiver: "press",
  matchup: "desk",
  trade: "desk",
  optimize: "desk",
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
  if (need === "free") return true;
  if (need === "press") return plan === "press" || plan === "desk";
  return plan === "desk";
}

function scoringBump(s: Scoring, pos: Player["pos"]) {
  if (pos !== "WR" && pos !== "RB" && pos !== "TE") return 0;
  if (s === "ppr") return 3.2;
  if (s === "half") return 1.6;
  return 0;
}

function playerById(id: string) {
  return PLAYERS.find((p) => p.id === id) || null;
}

export default function FantasyPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState<Scoring>("ppr");
  const [busy, setBusy] = useState<ToolId | null>(null);
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("");
  const [outputTitle, setOutputTitle] = useState("");

  const [sitA, setSitA] = useState("4");
  const [sitB, setSitB] = useState("6");
  const [waiverPos, setWaiverPos] = useState<Player["pos"]>("RB");
  const [matchTeam, setMatchTeam] = useState("KC");
  const [give, setGive] = useState("11");
  const [get, setGet] = useState("5");

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
        .map((p) => ({ ...p, adj: p.proj + scoringBump(scoring, p.pos) }))
        .sort((a, b) => b.adj - a.adj),
    [scoring]
  );

  const runTool = async (id: ToolId, title: string, text: string) => {
    setMessage("");
    if (!userId) {
      setMessage("Log in first.");
      return;
    }
    if (!allowed(plan, NEED[id])) {
      setMessage(NEED[id] === "desk" ? "Desk tool." : "Press or Desk tool.");
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
    setOutputTitle(title);
    setOutput(text);
    setBusy(null);
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
  };

  const startSit = () => {
    const a = playerById(sitA);
    const b = playerById(sitB);
    if (!a || !b || a.id === b.id) {
      setMessage("Pick two different players.");
      return;
    }
    const aAdj = a.proj + scoringBump(scoring, a.pos);
    const bAdj = b.proj + scoringBump(scoring, b.pos);
    const start = aAdj >= bAdj ? a : b;
    const sit = start.id === a.id ? b : a;
    const startN = start.id === a.id ? aAdj : bAdj;
    const sitN = start.id === a.id ? bAdj : aAdj;
    runTool(
      "startSit",
      `Start / Sit · ${COST.startSit} credit`,
      `START ${start.name} (${start.pos}, ${start.team} vs ${start.opp}) · ${startN.toFixed(1)} ${scoring.toUpperCase()} pts\nSIT ${sit.name} (${sit.pos}, ${sit.team} vs ${sit.opp}) · ${sitN.toFixed(1)}\n\nStub research, not a lock. Live projections replace this when a feed is connected.`
    );
  };

  const waiver = () => {
    const list = ranked.filter((p) => p.pos === waiverPos).slice(0, 3);
    runTool(
      "waiver",
      `Waiver brief · ${COST.waiver} credits`,
      list
        .map(
          (p, i) =>
            `${i + 1}. ${p.name} · ${p.team} vs ${p.opp} · ${p.adj.toFixed(1)} ${scoring.toUpperCase()} pts`
        )
        .join("\n") + "\n\nTarget the top name if you have a hole. This is a stub wire."
    );
  };

  const matchup = () => {
    const mine = ranked.filter((p) => p.team === matchTeam);
    const opps = [...new Set(mine.map((p) => p.opp))];
    runTool(
      "matchup",
      `Matchup preview · ${COST.matchup} credits`,
      `${matchTeam} this week vs ${opps.join(", ") || "TBD"}.\n\n` +
        mine
          .map((p) => `${p.pos} ${p.name} · ${p.adj.toFixed(1)} proj`)
          .join("\n") +
        `\n\n${scoring.toUpperCase()} scoring. Fat prompt later pulls injuries, snap counts, and weather.`
    );
  };

  const trade = () => {
    const g = playerById(give);
    const t = playerById(get);
    if (!g || !t || g.id === t.id) {
      setMessage("Pick two different players.");
      return;
    }
    const gN = g.proj + scoringBump(scoring, g.pos);
    const tN = t.proj + scoringBump(scoring, t.pos);
    const lean = tN >= gN ? `TAKE ${t.name}` : `KEEP ${g.name}`;
    runTool(
      "trade",
      `Trade analyzer · ${COST.trade} credits`,
      `You give ${g.name} (${gN.toFixed(1)})\nYou get ${t.name} (${tN.toFixed(1)})\n\n${lean} in ${scoring.toUpperCase()}.\n\nEngine pass: rest-of-season and roster holes land here when the feed is live.`
    );
  };

  const optimize = () => {
    const pick = (pos: Player["pos"], n: number) =>
      ranked.filter((p) => p.pos === pos).slice(0, n);
    const qb = pick("QB", 1);
    const rb = pick("RB", 2);
    const wr = pick("WR", 2);
    const te = pick("TE", 1);
    const flex = ranked
      .filter(
        (p) =>
          ["RB", "WR", "TE"].includes(p.pos) &&
          ![...rb, ...wr, ...te].some((x) => x.id === p.id)
      )
      .slice(0, 1);
    const k = pick("K", 1);
    const dst = pick("DST", 1);
    const lineup = [...qb, ...rb, ...wr, ...te, ...flex, ...k, ...dst];
    const total = lineup.reduce((s, p) => s + p.adj, 0);
    runTool(
      "optimize",
      `Lineup optimizer · ${COST.optimize} credits`,
      lineup.map((p) => `${p.pos.padEnd(3)} ${p.name} · ${p.adj.toFixed(1)}`).join("\n") +
        `\n\nProjected ${total.toFixed(1)} in ${scoring.toUpperCase()} (1QB/2RB/2WR/1TE/FLEX/K/DST).\nStub engine. Real optimizer needs the weekly feed.`
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
          You need a theBallpit account to run the Fantasy desk.
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
            NFL stub board. AI taps spend credits. Live feed comes later.
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
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-3">Scoring</div>
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
        <p className="text-[11px] text-muted-pit mt-3">
          1 QB · 2 RB · 2 WR · 1 TE · 1 FLEX · K · DST. PPR bumps skill players on this stub board.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 space-y-4">
          <div className="pit-panel p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Board</h2>
              <span className="text-[10px] uppercase tracking-wide text-muted-pit">{scoring}</span>
            </div>
            <div className="space-y-1 max-h-[520px] overflow-auto pr-1">
              {ranked.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 border border-white/5"
                  style={{ background: "rgba(0,0,0,0.16)" }}
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

        <section className="lg:col-span-2 space-y-4">
          <ToolCard
            title="Start / Sit"
            blurb="Two names. One start."
            cost={COST.startSit}
            need="Press"
            locked={!allowed(plan, NEED.startSit)}
            busy={busy === "startSit"}
            onRun={startSit}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select value={sitA} onChange={setSitA} />
              <Select value={sitB} onChange={setSitB} />
            </div>
          </ToolCard>

          <ToolCard
            title="Waiver brief"
            blurb="Top three on this stub wire."
            cost={COST.waiver}
            need="Press"
            locked={!allowed(plan, NEED.waiver)}
            busy={busy === "waiver"}
            onRun={waiver}
          >
            <div className="flex flex-wrap gap-2">
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
          </ToolCard>

          <ToolCard
            title="Matchup preview"
            blurb="One team, this week."
            cost={COST.matchup}
            need="Desk"
            locked={!allowed(plan, NEED.matchup)}
            busy={busy === "matchup"}
            onRun={matchup}
          >
            <select
              value={matchTeam}
              onChange={(e) => setMatchTeam(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            >
              {[...new Set(PLAYERS.map((p) => p.team))].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </ToolCard>

          <ToolCard
            title="Trade analyzer"
            blurb="Give one. Get one."
            cost={COST.trade}
            need="Desk"
            locked={!allowed(plan, NEED.trade)}
            busy={busy === "trade"}
            onRun={trade}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-muted-pit mb-1">Give</div>
                <Select value={give} onChange={setGive} />
              </div>
              <div>
                <div className="text-[11px] text-muted-pit mb-1">Get</div>
                <Select value={get} onChange={setGet} />
              </div>
            </div>
          </ToolCard>

          <ToolCard
            title="Lineup optimizer"
            blurb="Fill a standard roster from the board."
            cost={COST.optimize}
            need="Desk"
            locked={!allowed(plan, NEED.optimize)}
            busy={busy === "optimize"}
            onRun={optimize}
          />

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

function Select({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2 text-sm"
    >
      {PLAYERS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.pos} {p.name}
        </option>
      ))}
    </select>
  );
}

function ToolCard({
  title,
  blurb,
  cost,
  need,
  locked,
  busy,
  onRun,
  children,
}: {
  title: string;
  blurb: string;
  cost: number;
  need: string;
  locked: boolean;
  busy: boolean;
  onRun: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="pit-panel p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-pit">{blurb}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-highlight-pit">
            {cost} credit{cost === 1 ? "" : "s"}
          </div>
          <div className="text-[10px] text-muted-pit">{need}</div>
        </div>
      </div>
      {children && <div className="mb-3">{children}</div>}
      <button
        type="button"
        onClick={onRun}
        disabled={locked || busy}
        className="btn-write w-full px-4 py-2.5 rounded-xl text-sm disabled:opacity-45"
      >
        {locked ? `${need} 🔒` : busy ? "Spending..." : `Run · ${cost}`}
      </button>
    </div>
  );
}
