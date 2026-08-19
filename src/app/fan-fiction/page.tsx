"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CREDIT_COST } from "@/lib/tiers";
import { spendAiCredits } from "@/lib/aiCredits";

type Tone = "funny" | "serious" | "mad" | "chaotic";

type Setup = {
  id: string;
  headline: string;
  slots: { key: string; label: string; placeholder: string }[];
};

const TONES: { id: Tone; label: string }[] = [
  { id: "funny", label: "Funny" },
  { id: "serious", label: "Serious" },
  { id: "mad", label: "Mad" },
  { id: "chaotic", label: "Chaotic" },
];

const SETUPS: Setup[] = [
  {
    id: "trade",
    headline: "A shocking trade rumor nobody asked for",
    slots: [
      { key: "star", label: "Athlete / celebrity", placeholder: "Patrick Mahomes" },
      { key: "team", label: "Team / franchise", placeholder: "the Jets" },
      { key: "object", label: "Ridiculous object", placeholder: "a used air fryer" },
      { key: "place", label: "Place", placeholder: "a Buc-ee's parking lot" },
    ],
  },
  {
    id: "awards",
    headline: "An awards-night meltdown",
    slots: [
      { key: "star", label: "Famous person", placeholder: "Taylor Swift" },
      { key: "award", label: "Award / title", placeholder: "Best Supporting Hot Dog" },
      { key: "rival", label: "Rival", placeholder: "a mascot" },
      { key: "snack", label: "Snack", placeholder: "gas-station taquitos" },
    ],
  },
  {
    id: "presser",
    headline: "A press conference that went off the rails",
    slots: [
      { key: "coach", label: "Coach / boss", placeholder: "Andy Reid" },
      { key: "verb", label: "Past-tense verb", placeholder: "yeeted" },
      { key: "item", label: "Item", placeholder: "the Gatorade bucket" },
      { key: "city", label: "City", placeholder: "Cleveland" },
    ],
  },
  {
    id: "dating",
    headline: "A celebrity dating rumor with no sources",
    slots: [
      { key: "star", label: "Person", placeholder: "Travis Kelce" },
      { key: "other", label: "Other person", placeholder: "the Popeyes cashier" },
      { key: "spot", label: "Spotted at", placeholder: "a laundromat" },
      { key: "prop", label: "Prop they were holding", placeholder: "a live lobster" },
    ],
  },
  {
    id: "record",
    headline: "A record that definitely did not happen",
    slots: [
      { key: "athlete", label: "Athlete", placeholder: "Shohei Ohtani" },
      { key: "stat", label: "Impossible stat", placeholder: "47 touchdowns in one quarter" },
      { key: "foe", label: "Opponent", placeholder: "a youth soccer team" },
      { key: "excuse", label: "Excuse", placeholder: "Mercury in retrograde" },
    ],
  },
];

function pickSetup(avoid?: string) {
  const pool = SETUPS.filter((s) => s.id !== avoid);
  return pool[Math.floor(Math.random() * pool.length)] || SETUPS[0];
}

function buildSatire(setup: Setup, values: Record<string, string>, tone: Tone, author: string) {
  const v = (key: string) =>
    values[key]?.trim() || setup.slots.find((s) => s.key === key)?.placeholder || "someone";
  const toneLine =
    tone === "serious"
      ? "Filed in a tone of grave national importance, which is a choice."
      : tone === "mad"
      ? "Written at a volume usually reserved for parking-lot arguments."
      : tone === "chaotic"
      ? "The facts have left the building. They took the snacks."
      : "This is a bit. Treat it like a bit.";

  let title = "Satire dispatch";
  let body = "";

  if (setup.id === "trade") {
    title = `${v("star")} to ${v("team")} in deal centered on ${v("object")}`;
    body = `Sources that do not exist say ${v("star")} is headed to ${v("team")} after talks held at ${v("place")}. The return package is reportedly ${v("object")} and “future considerations,” a phrase that here means nothing.\n\n${toneLine}\n\n${author} stresses this is satire. No front office was interviewed, because none would pick up.`;
  } else if (setup.id === "awards") {
    title = `${v("star")} snubbed for ${v("award")}, blames ${v("rival")}`;
    body = `In a speech that ran longer than the ceremony, ${v("star")} accepted defeat for ${v("award")} by pointing at ${v("rival")} and demanding ${v("snack")} be added to the official gift bag.\n\n${toneLine}\n\nNone of this was broadcast. None of this happened. ${author} made it up on purpose.`;
  } else if (setup.id === "presser") {
    title = `${v("coach")} ${v("verb")} ${v("item")} in ${v("city")}`;
    body = `The podium survived. ${v("item")} did not. ${v("coach")} ${v("verb")} it in ${v("city")} after a question about effort, vibes, and whether the season is “still a process.”\n\n${toneLine}\n\nSatire. Invented. If you quote this as news, that is on you.`;
  } else if (setup.id === "dating") {
    title = `${v("star")} and ${v("other")} spotted at ${v("spot")}`;
    body = `A photographer who is also imaginary caught ${v("star")} with ${v("other")} at ${v("spot")}, holding ${v("prop")}. Friends say they are “keeping it casual,” which in this story means “this is fake.”\n\n${toneLine}\n\nFiled as satire by ${author}.`;
  } else {
    title = `${v("athlete")} posts ${v("stat")} against ${v("foe")}`;
    body = `Box scores will not confirm that ${v("athlete")} put up ${v("stat")} versus ${v("foe")}. The official explanation is ${v("excuse")}.\n\n${toneLine}\n\nThis is satire from ${author}. It is not a recap.`;
  }

  return { title, body };
}

export default function SatireLabPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("User");
  const [credits, setCredits] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);

  const [setup, setSetup] = useState<Setup>(SETUPS[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [tone, setTone] = useState<Tone>("funny");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [articleId, setArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [inThePit, setInThePit] = useState(false);

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
        .select("display_name, ai_credits")
        .eq("id", user.id)
        .maybeSingle();
      setAuthorName(
        profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "User"
      );
      setCredits(Number(profile?.ai_credits ?? 0));
      setAuthLoading(false);
    };
    boot();
  }, []);

  const filled = useMemo(
    () => setup.slots.every((s) => (values[s.key] || "").trim().length > 0),
    [setup, values]
  );

  const refreshSetup = () => {
    const next = pickSetup(setup.id);
    setSetup(next);
    setValues({});
    setMessage("New blanks. Old piece on your desk is still there if you already generated.");
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
    if (credits < CREDIT_COST.satire) {
      setMessage(`Need ${CREDIT_COST.satire} AI credit. Open theMoneyPit.`);
      return;
    }

    setBusy(true);
    const spend = await spendAiCredits(CREDIT_COST.satire, "satire");
    if (!spend.ok) {
      setMessage(spend.reason);
      setBusy(false);
      return;
    }
    setCredits(spend.remaining);

    const piece = buildSatire(setup, values, tone, authorName);
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
      setTitle(piece.title);
      setBody(piece.body);
      setArticleId(null);
      setInThePit(false);
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
        <h1 className="text-3xl font-extrabold mb-2">Satire Lab</h1>
        <p className="text-sm text-muted-pit mb-4">
          You need a theBallpit account to run the lab.
        </p>
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
          SATIRE
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,230,199,0.92)" }}>
          Fill-in-the-blank fiction. Not news. Generating saves it to your desk only. Public
          satire feed happens only if you throw it in the pit.
        </p>
      </div>

      <h1 className="text-3xl font-extrabold mb-1">Satire Lab</h1>
      <p className="text-sm text-muted-pit mb-5">
        AI credits: {credits} · satire costs {CREDIT_COST.satire}
      </p>

      <div className="pit-panel p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Setup</div>
            <div className="font-semibold">{setup.headline}</div>
          </div>
          <button type="button" onClick={refreshSetup} className="btn-metal text-xs px-3 py-1.5 rounded-lg">
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs ${tone === t.id ? "btn-write" : "btn-metal"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {setup.slots.map((slot) => (
            <label key={slot.key} className="block">
              <span className="text-xs text-muted-pit block mb-1">{slot.label}</span>
              <input
                value={values[slot.key] || ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [slot.key]: e.target.value }))}
                placeholder={slot.placeholder}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="btn-write w-full mt-4 px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
        >
          {busy ? "Working..." : "Generate"}
        </button>
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
