"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SatireMark from "@/components/SatireMark";
import { supabase } from "@/lib/supabaseClient";
import { creditCost, defaultModel, type AiModel } from "@/lib/creditTable";
import ModelPicker from "@/components/ModelPicker";
import { spendAiCredits } from "@/lib/aiCredits";
import ComputeButton from "@/components/ComputeButton";

type Tone = "funny" | "serious" | "mad" | "chaotic" | "roast" | "locker" | "degenerate" | "unhinged";

type Slot = { key: string; hint: string };

type Setup = {
  id: string;
  parts: (string | Slot)[];
};

const TONES: { id: Tone; label: string; paid?: "press" | "desk" }[] = [
  { id: "funny", label: "Funny" },
  { id: "roast", label: "Roast", paid: "press" },
  { id: "locker", label: "Locker room", paid: "desk" },
  { id: "degenerate", label: "Degenerate", paid: "desk" },
  { id: "unhinged", label: "Unhinged", paid: "desk" },
];

const SETUPS: Setup[] = [
  {
    id: "trade",
    parts: [
      { key: "star", hint: "athlete" },
      " is headed to ",
      { key: "team", hint: "team" },
      " in a deal for ",
      { key: "object", hint: "ridiculous object" },
      ", negotiated at ",
      { key: "place", hint: "place" },
      ".",
    ],
  },
  {
    id: "awards",
    parts: [
      { key: "star", hint: "famous person" },
      " lost ",
      { key: "award", hint: "fake award" },
      " to ",
      { key: "rival", hint: "rival" },
      " and demanded ",
      { key: "snack", hint: "snack" },
      " in the gift bag.",
    ],
  },
  {
    id: "presser",
    parts: [
      { key: "coach", hint: "coach" },
      " ",
      { key: "verb", hint: "past-tense verb" },
      " ",
      { key: "item", hint: "item" },
      " during a presser in ",
      { key: "city", hint: "city" },
      ".",
    ],
  },
  {
    id: "dating",
    parts: [
      { key: "star", hint: "person" },
      " and ",
      { key: "other", hint: "other person" },
      " were spotted at ",
      { key: "spot", hint: "place" },
      " holding ",
      { key: "prop", hint: "object" },
      ".",
    ],
  },
  {
    id: "record",
    parts: [
      { key: "athlete", hint: "athlete" },
      " put up ",
      { key: "stat", hint: "impossible stat" },
      " against ",
      { key: "foe", hint: "opponent" },
      " because of ",
      { key: "excuse", hint: "excuse" },
      ".",
    ],
  },
];

function slotsOf(setup: Setup) {
  return setup.parts.filter((p): p is Slot => typeof p !== "string");
}

function pickSetup(avoid?: string) {
  const pool = SETUPS.filter((s) => s.id !== avoid);
  return pool[Math.floor(Math.random() * pool.length)] || SETUPS[0];
}

function val(values: Record<string, string>, key: string, fallback: string) {
  return values[key]?.trim() || fallback;
}

/** Hard floor only. Crude adult jokes pass. This is the same gate the live model will use. */
function reviewSatire(text: string): { ok: boolean; reason: string } {
  const t = text.toLowerCase();

  const minorHit =
    /\b(preteen|pre-teen|pedo|pedophile|child porn|csam|loli|shota)\b/.test(t) ||
    (/\b(kid|kids|child|children|minor|underage|teen|teenager|middle school|elementary)\b/.test(t) &&
      /\b(nude|naked|sex|sexual|porn|rape|molest)\b/.test(t));
  if (minorHit) {
    return { ok: false, reason: "Out of bounds. Nothing saved to the desk." };
  }

  if (/\b(dox|doxx|social security|home address|swat them)\b/.test(t)) {
    return { ok: false, reason: "Out of bounds. Nothing saved to the desk." };
  }

  if (
    /\b(deepfake|revenge porn|real nude|leaked nudes|sex tape)\b/.test(t) &&
    /\b(her|his|their|celeb|celebrity|actress|wife|girlfriend)\b/.test(t)
  ) {
    return { ok: false, reason: "Out of bounds. Nothing saved to the desk." };
  }

  if (/\b(i will kill|going to kill you|bomb the|shoot up)\b/.test(t)) {
    return { ok: false, reason: "Out of bounds. Nothing saved to the desk." };
  }

  return { ok: true, reason: "" };
}

function buildSatire(setup: Setup, values: Record<string, string>, tone: Tone, author: string) {
  const toneLine =
    tone === "roast"
      ? "Written like a roast with the seatbelt off."
      : tone === "locker"
      ? "Locker-room volume. Still a bit."
      : tone === "degenerate"
      ? "Degenerate on purpose. Still satire."
      : tone === "unhinged"
      ? "Unhinged. The brakes were optional."
      : tone === "mad"
      ? "Written at parking-lot volume."
      : tone === "serious"
      ? "Filed like it matters. It does not."
      : "This is a bit. Treat it like a bit.";

  const sentence = setup.parts
    .map((p) => (typeof p === "string" ? p : val(values, p.key, p.hint)))
    .join("");

  if (setup.id === "trade") {
    return {
      title: `${val(values, "star", "A star")} to ${val(values, "team", "a team")} for ${val(values, "object", "junk")}`,
      body: `${sentence}\n\nSources that do not exist confirm the return package includes “future considerations.”\n\n${toneLine}\n\nSatire by ${author}. Not news.`,
    };
  }
  if (setup.id === "awards") {
    return {
      title: `${val(values, "star", "A celebrity")} snubbed for ${val(values, "award", "an award")}`,
      body: `${sentence}\n\nNobody clapped. The cameras were also imaginary.\n\n${toneLine}\n\nSatire by ${author}. Not news.`,
    };
  }
  if (setup.id === "presser") {
    return {
      title: `${val(values, "coach", "A coach")} ${val(values, "verb", "yeeted")} ${val(values, "item", "something")} in ${val(values, "city", "a city")}`,
      body: `${sentence}\n\nThe podium survived. The quote did not, because it was never said.\n\n${toneLine}\n\nSatire by ${author}. Not news.`,
    };
  }
  if (setup.id === "dating") {
    return {
      title: `${val(values, "star", "Someone")} and ${val(values, "other", "someone")} spotted together`,
      body: `${sentence}\n\nFriends say they are “keeping it casual,” which in this story means this is fake.\n\n${toneLine}\n\nSatire by ${author}. Not news.`,
    };
  }
  return {
    title: `${val(values, "athlete", "An athlete")} posts ${val(values, "stat", "a fake stat")}`,
    body: `${sentence}\n\nBox scores will not confirm any of this.\n\n${toneLine}\n\nSatire by ${author}. Not news.`,
  };
}

function Blank({
  hint,
  value,
  onChange,
}: {
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const width = Math.max(hint.length, value.length, 8);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={hint}
      className="inline-block mx-1 px-1 bg-transparent outline-none text-highlight-pit font-semibold"
      style={{
        width: `${width + 1}ch`,
        border: "none",
        borderBottom: "2px solid color-mix(in srgb, var(--pit-highlight) 70%, transparent)",
        borderRadius: 0,
      }}
    />
  );
}

export default function SatireLabPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("User");
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState<"free" | "press" | "desk">("free");
  const [authLoading, setAuthLoading] = useState(true);
  const [setup, setSetup] = useState<Setup>(SETUPS[2]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [tone, setTone] = useState<Tone>("funny");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [inThePit, setInThePit] = useState(false);
  const [model, setModel] = useState<AiModel>("haiku");

  useEffect(() => {
    setSetup(pickSetup());
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setAuthLoading(false);
        return;
      }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, ai_credits, plan")
        .eq("id", user.id)
        .maybeSingle();
      setAuthorName(
        profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "User"
      );
      setCredits(Number(profile?.ai_credits ?? 0));
      const p = String(profile?.plan || "free").toLowerCase();
      const nextPlan = p === "desk" ? "desk" : p === "press" ? "press" : "free";
      setPlan(nextPlan);
      setModel(defaultModel(nextPlan));
      setAuthLoading(false);
    };
    boot();
  }, []);

  const slots = useMemo(() => slotsOf(setup), [setup]);
  const filled = slots.every((s) => (values[s.key] || "").trim().length > 0);

  const toneAllowed = (t: (typeof TONES)[number]) => {
    if (!t.paid) return true;
    if (t.paid === "press") return plan === "press" || plan === "desk";
    return plan === "desk";
  };

  const refreshSetup = () => {
    setSetup(pickSetup(setup.id));
    setValues({});
    setMessage("New blanks.");
  };

  const generate = async () => {
    setMessage("");
    if (!userId) {
      setMessage("Log in first.");
      return;
    }
    if (!filled) {
      setMessage("Fill every blank.");
      return;
    }

    const raw = slots.map((s) => values[s.key] || "").join(" ");
    const gate = reviewSatire(raw);
    if (!gate.ok) {
      setMessage(gate.reason);
      return;
    }

    const cost = creditCost("satireLab", model) ?? 1;
    if (credits < cost) {
      setMessage(`Need ${cost} AI credit. Open theMoneyPit.`);
      return;
    }

    const piece = buildSatire(setup, values, tone, authorName);
    const outGate = reviewSatire(`${piece.title}\n${piece.body}`);
    if (!outGate.ok) {
      setMessage(outGate.reason);
      return;
    }

    setBusy(true);
    const spend = await spendAiCredits(cost, "satireLab");
    if (!spend.ok) {
      setMessage(spend.reason);
      setBusy(false);
      return;
    }
    setCredits(spend.remaining);

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: piece.title,
        body: piece.body,
        section: "Satire",
        user_id: userId,
        author_name: authorName,
        status: "author_only",
      })
      .select("id")
      .single();

    setBusy(false);
    if (error || !data) {
      setMessage(error?.message || "Desk write failed.");
      return;
    }

    setTitle(piece.title);
    setBody(piece.body);
    setArticleId(data.id);
    setInThePit(false);
    setMessage("On your desk. Not in the pit yet.");
  };

  const throwInThePit = async () => {
    if (!articleId || !userId) {
      setMessage("Generate a piece first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("articles")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", articleId)
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setInThePit(true);
    setMessage("It is in the pit.");
  };

  if (authLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-sm text-muted-pit">Loading the lab...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-pit mb-3">theBallpit</p>
        <h1 className="text-3xl font-extrabold mb-3"><SatireMark /></h1>
        <p className="text-2xl md:text-3xl font-extrabold mb-4" style={{ letterSpacing: "-0.03em" }}>
          <span style={{ color: "#F4F7FB" }}>not news. </span>
          <span style={{ color: "#D4A056" }}>on purpose.</span>
        </p>
        <p className="text-sm text-muted-pit mb-6">satireLab. Fiction. Not reporting. An account is required to run a prompt.</p>
        <Link href="/login" className="btn-write inline-block px-5 py-2.5 rounded-xl text-sm">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div
        className="sticky top-16 z-20 -mx-4 px-4 py-3 mb-6 border-y"
        style={{
          background: "color-mix(in srgb, #7a1f1f 55%, #1E2022 45%)",
          borderColor: "rgba(255,180,120,0.35)",
        }}
      >
        <div className="text-sm font-bold tracking-wide" style={{ color: "#FFE6C7" }}>
          SATIRE LAB
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,230,199,0.92)" }}>
          Fill-in-the-blank fiction lab. Not news. A run saves to your desk only. Public
          satire happens only if you throw it in the pit. Out-of-bounds prompts never hit
          the desk.
        </p>
      </div>

      <h1 className="text-3xl font-extrabold mb-2"><SatireMark /></h1>
      <p className="text-xl font-extrabold mb-3" style={{ letterSpacing: "-0.03em" }}>
        <span style={{ color: "#F4F7FB" }}>not news. </span>
        <span style={{ color: "#D4A056" }}>on purpose.</span>
      </p>
      <p className="text-sm text-muted-pit mb-5">
        AI credits: {credits}
      </p>

      <div className="pit-panel p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Fill in the blanks</div>
          <button type="button" onClick={refreshSetup} className="btn-metal text-xs px-3 py-1.5 rounded-lg">
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {TONES.map((t) => {
            const on = toneAllowed(t);
            return (
              <button
                key={t.id}
                type="button"
                disabled={!on}
                onClick={() => on && setTone(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs ${
                  tone === t.id ? "btn-write" : "btn-metal"
                } disabled:opacity-40`}
                title={!on ? `${t.paid === "desk" ? "Desk" : "Press"} voice` : t.label}
              >
                {t.label}
                {!on ? " 🔒" : ""}
              </button>
            );
          })}
        </div>

        <p className="text-lg md:text-xl leading-loose mb-5" style={{ color: "var(--pit-text)" }}>
          {setup.parts.map((part, i) =>
            typeof part === "string" ? (
              <span key={i}>{part}</span>
            ) : (
              <Blank
                key={part.key}
                hint={part.hint}
                value={values[part.key] || ""}
                onChange={(v) => setValues((prev) => ({ ...prev, [part.key]: v }))}
              />
            )
          )}
        </p>

        <ModelPicker plan={plan} job="satireLab" value={model} onChange={setModel} />
        <ComputeButton
          job="satireLab"
          model={model}
          label="Run satireLab"
          busy={busy}
          onConfirm={generate}
        />
      </div>

      {title && (
        <div className="pit-panel p-5 mb-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">
            {inThePit ? "In the pit" : "On your desk"}
          </div>
          <h2 className="text-xl font-bold mb-3">{title}</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed mb-4">{body}</p>
          {!inThePit && (
            <button
              type="button"
              onClick={throwInThePit}
              disabled={busy || !articleId}
              className="btn-write w-full px-4 py-3 rounded-xl text-sm disabled:opacity-60"
            >
              throw it in the pit?
            </button>
          )}
          {inThePit && articleId && (
            <Link href={`/article/${articleId}`} className="btn-metal inline-block px-4 py-2 rounded-xl text-sm">
              View in the pit
            </Link>
          )}
        </div>
      )}

      {message && <p className="text-sm text-muted-pit">{message}</p>}
    </main>
  );
}



