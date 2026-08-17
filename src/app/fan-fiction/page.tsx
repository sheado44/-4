"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type PromptPack = {
  id: string;
  title: string;
  template: string; // use {{key}} blanks
  fields: { key: string; label: string; placeholder: string }[];
  buildTitle: (vals: Record<string, string>) => string;
  buildBody: (vals: Record<string, string>, tone: string) => string;
};

const TONES = ["Funny", "Chaotic", "Deadpan", "Overdramatic", "Sports Radio"] as const;

const PROMPT_PACKS: PromptPack[] = [
  {
    id: "locker",
    title: "Locker Room Chaos",
    template:
      "At {{place}}, {{star}} suddenly {{verb}} while holding a {{object}}, and {{rival}} could only watch as {{outcome}}.",
    fields: [
      { key: "place", label: "place", placeholder: "Arrowhead Stadium" },
      { key: "star", label: "star", placeholder: "Patrick Mahomes" },
      { key: "verb", label: "verb", placeholder: "moonwalked" },
      { key: "object", label: "object", placeholder: "glow-in-the-dark football" },
      { key: "rival", label: "rival", placeholder: "the opposing mascot" },
      { key: "outcome", label: "outcome", placeholder: "the scoreboard apologized" },
    ],
    buildTitle: (v) => `${v.star} ${v.verb} Into History at ${v.place}`,
    buildBody: (v, tone) =>
      `In a development nobody requested, ${v.star} reportedly ${v.verb} across ${v.place} while clutching a ${v.object}.\n\n` +
      `${v.rival} tried to restore order, but it was already too late. By the end, ${v.outcome}.\n\n` +
      `This ${tone.toLowerCase()} satire is not real reporting. It is pure Ballpit nonsense.\n\n` +
      `![satire](https://placehold.co/1200x630/7c3aed/ffffff/png?text=Satire+Scene)`,
  },
  {
    id: "press",
    title: "Press Conference Meltdown",
    template:
      "{{coach}} told reporters in {{city}} that {{team}} would {{verb}} the season with a {{object}}, then added, \"{{quote}}.\"",
    fields: [
      { key: "coach", label: "coach", placeholder: "Coach Rivera" },
      { key: "city", label: "city", placeholder: "Chicago" },
      { key: "team", label: "team", placeholder: "the underdogs" },
      { key: "verb", label: "verb", placeholder: "reinvent" },
      { key: "object", label: "object", placeholder: "bag of frozen peas" },
      { key: "quote", label: "quote", placeholder: "we were never not winning" },
    ],
    buildTitle: (v) => `${v.coach} Stuns ${v.city} With Unhinged Presser`,
    buildBody: (v, tone) =>
      `${v.coach} stood before the media in ${v.city} and announced that ${v.team} would ${v.verb} the season using a ${v.object}.\n\n` +
      `"${v.quote}," ${v.coach} said, in a tone best described as ${tone.toLowerCase()}.\n\n` +
      `Reporters requested clarification. The podium declined comment.\n\n` +
      `![satire](https://placehold.co/1200x630/312e81/f5f3ff/png?text=Press+Conference+Satire)`,
  },
  {
    id: "trade",
    title: "Ridiculous Trade Rumor",
    template:
      "Sources say {{player}} is leaving {{teamA}} for {{teamB}} in exchange for {{asset}}, according to {{source}}, sparking {{reaction}}.",
    fields: [
      { key: "player", label: "player", placeholder: "Shohei Ohtani" },
      { key: "teamA", label: "team A", placeholder: "the Cubs" },
      { key: "teamB", label: "team B", placeholder: "a minor-league snack stand" },
      { key: "asset", label: "asset", placeholder: "three draft picks and a blender" },
      { key: "source", label: "source", placeholder: "a guy outside the stadium" },
      { key: "reaction", label: "reaction", placeholder: "collective confusion" },
    ],
    buildTitle: (v) => `Report: ${v.player} Headed to ${v.teamB}`,
    buildBody: (v, tone) =>
      `According to ${v.source}, ${v.player} is moving from ${v.teamA} to ${v.teamB} for ${v.asset}.\n\n` +
      `The leak, dripping with ${tone.toLowerCase()} energy, caused ${v.reaction} across the fanbase.\n\n` +
      `This is satire. Do not rearrange your fantasy roster.\n\n` +
      `![satire](https://placehold.co/1200x630/111827/fb923c/png?text=Trade+Rumor+Satire)`,
  },
];

function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = (values[key] || "").trim();
    return val || `〔${key}〕`;
  });
}

export default function SatireLabPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("User");
  const [packIndex, setPackIndex] = useState(0);
  const [tone, setTone] = useState<(typeof TONES)[number]>("Funny");
  const [values, setValues] = useState<Record<string, string>>({});
  const [resultTitle, setResultTitle] = useState("");
  const [resultBody, setResultBody] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const pack = PROMPT_PACKS[packIndex];

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setUserId(null);
        setAuthLoading(false);
        return;
      }
      setUserId(user.id);
      setDisplayName(
        user.user_metadata?.display_name || user.email?.split("@")[0] || "User"
      );
      setAuthLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const next: Record<string, string> = {};
    pack.fields.forEach((f) => {
      next[f.key] = "";
    });
    setValues(next);
    setResultTitle("");
    setResultBody("");
    setMessage("");
    setPublishedId(null);
  }, [packIndex]);

  const filledPrompt = useMemo(
    () => fillTemplate(pack.template, values),
    [pack.template, values]
  );

  const canGenerate = useMemo(
    () => pack.fields.every((f) => (values[f.key] || "").trim().length > 0),
    [pack.fields, values]
  );

  const refreshPack = () => {
    setPackIndex((i) => (i + 1) % PROMPT_PACKS.length);
  };

  const awardPoints = async (uid: string, articleId: string) => {
    await supabase.from("points_ledger").insert({
      user_id: uid,
      points: 5,
      reason: "Published satire article",
      article_id: articleId,
    });
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", uid)
      .maybeSingle();
    await supabase.from("profiles").upsert({
      id: uid,
      points: (profile?.points ?? 0) + 5,
      updated_at: new Date().toISOString(),
    });
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
  };

  const generateAndPost = async () => {
    if (!userId) return;
    if (!canGenerate) {
      setMessage("Fill in every blank first.");
      return;
    }

    setWorking(true);
    setMessage("");
    setPublishedId(null);

    try {
      const cleaned: Record<string, string> = {};
      pack.fields.forEach((f) => {
        cleaned[f.key] = values[f.key].trim();
      });

      const title = pack.buildTitle(cleaned);
      const bodyCore = pack.buildBody(cleaned, tone);
      const body =
        `![satire banner](https://placehold.co/1200x400/7c3aed/ffffff/png?text=SATIRE)\n\n` +
        bodyCore;

      // show output immediately
      setResultTitle(title);
      setResultBody(bodyCore);

      // auto-post — no user choice
      const { data, error } = await supabase
        .from("articles")
        .insert({
          user_id: userId,
          title,
          section: "Satire",
          body,
          author_name: displayName,
        })
        .select("id")
        .single();

      if (error) {
        setMessage(`Generated, but post failed: ${error.message}`);
      } else {
        await awardPoints(userId, data.id);
        setPublishedId(data.id);
        setMessage("Satire generated and posted automatically. +5 points");
      }
    } catch {
      setMessage("Something went wrong while generating/posting.");
    } finally {
      setWorking(false);
    }
  };

  if (authLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-300">Loading satire lab...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">Satire Lab</h1>
        <p className="text-gray-300 mb-6">
          Account required to generate and auto-post satire.
        </p>
        <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-forge-accent text-white font-medium">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-200 text-xs font-semibold mb-3">
          SATIRE · auto-posted
        </div>
        <h1 className="text-3xl font-bold mb-2">Satire Lab</h1>
        <p className="text-gray-300 text-sm">
          Fill in the blanks. Generate. It posts automatically.
        </p>
      </div>

      <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-sm text-gray-400">Prompt set</div>
            <div className="font-semibold">{pack.title}</div>
          </div>
          <button
            type="button"
            onClick={refreshPack}
            className="px-3 py-2 rounded-xl bg-black/20 text-sm hover:bg-black/30"
          >
            New blanks
          </button>
        </div>

        {/* Fill-in-the-blanks sentence */}
        <div className="rounded-xl bg-black/20 border border-forge-800 p-4 mb-5 text-sm leading-relaxed text-gray-100">
          {filledPrompt}
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
            className="w-full bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm outline-none"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {pack.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                {field.label}
              </label>
              <input
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                className="w-full bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={generateAndPost}
          disabled={!canGenerate || working}
          className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm disabled:opacity-50"
        >
          {working ? "Generating & posting..." : "Generate & auto-post satire"}
        </button>
      </div>

      {(resultTitle || resultBody) && (
        <div className="bg-forge-900 border border-purple-500/30 rounded-2xl p-5 mb-4">
          <div className="text-xs uppercase tracking-wide text-purple-200 mb-2">
            AI result (posted)
          </div>
          <h2 className="text-xl font-bold mb-3">{resultTitle}</h2>
          <div className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">
            {resultBody}
          </div>
        </div>
      )}

      {message && <p className="text-sm text-yellow-200 mb-3">{message}</p>}

      {publishedId && (
        <Link href={`/article/${publishedId}`} className="inline-block text-sm text-purple-200">
          View posted satire →
        </Link>
      )}

      <div className="mt-8">
        <Link href="/" className="text-sm text-gray-300 hover:text-white">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
