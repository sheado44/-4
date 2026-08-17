"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type PromptPack = {
  id: string;
  title: string;
  fields: { key: string; label: string; placeholder: string }[];
  build: (vals: Record<string, string>, tone: string) => string;
};

const TONES = ["Funny", "Chaotic", "Deadpan", "Overdramatic", "Sports Radio"] as const;

const PROMPT_PACKS: PromptPack[] = [
  {
    id: "locker-room",
    title: "Locker Room Chaos",
    fields: [
      { key: "star", label: "Star player / celebrity", placeholder: "Patrick Mahomes" },
      { key: "rival", label: "Rival / side character", placeholder: "a mascot named Larry" },
      { key: "place", label: "Place", placeholder: "Arrowhead Stadium" },
      { key: "object", label: "Weird object", placeholder: "glow-in-the-dark football" },
      { key: "verb", label: "Action verb", placeholder: "moonwalked" },
      { key: "outcome", label: "Wild outcome", placeholder: "the scoreboard apologized" },
    ],
    build: (v, tone) =>
      `# ${v.star} ${v.verb} Into History at ${v.place}\n\n` +
      `In a development nobody requested and everyone will pretend they predicted, ${v.star} reportedly ${v.verb} across ${v.place} while holding a ${v.object}.\n\n` +
      `Witnesses say ${v.rival} tried to intervene, only to discover the ${v.object} had already filed for free agency.\n\n` +
      `Tone check: this piece is pure ${tone.toLowerCase()} satire.\n\n` +
      `By the fourth quarter of whatever this was, ${v.outcome}. League officials declined to comment, mostly because they were busy rewriting the rulebook in crayon.\n\n` +
      `![satire image](https://placehold.co/1200x630/1f2937/a78bfa/png?text=Satire+Scene)\n\n` +
      `Analysts later confirmed the only real winner was the ${v.object}.`,
  },
  {
    id: "press-conference",
    title: "Press Conference Meltdown",
    fields: [
      { key: "coach", label: "Coach / executive", placeholder: "Coach Rivera" },
      { key: "team", label: "Team / brand", placeholder: "the underdogs" },
      { key: "city", label: "City", placeholder: "Chicago" },
      { key: "noun", label: "Random noun", placeholder: "bag of frozen peas" },
      { key: "quote", label: "Fake quote fragment", placeholder: "we were never not winning" },
      { key: "twist", label: "Plot twist", placeholder: "the podium walked away" },
    ],
    build: (v, tone) =>
      `# ${v.coach} Addresses ${v.city} After the Unexplainable\n\n` +
      `${v.coach} stood before reporters in ${v.city}, flanked by ${v.team} staff and one highly suspicious ${v.noun}.\n\n` +
      `"${v.quote}," ${v.coach} said, in a tone best described as ${tone.toLowerCase()}.\n\n` +
      `Then ${v.twist}.\n\n` +
      `![press conference](https://placehold.co/1200x630/312e81/f5f3ff/png?text=Press+Conference+Satire)\n\n` +
      `Local coverage remains divided on whether this was strategy, performance art, or both.`,
  },
  {
    id: "trade-rumor",
    title: "Ridiculous Trade Rumor",
    fields: [
      { key: "player", label: "Player / star", placeholder: "Shohei Ohtani" },
      { key: "teamA", label: "Team A", placeholder: "the Cubs" },
      { key: "teamB", label: "Team B", placeholder: "a minor league snack stand" },
      { key: "asset", label: "Trade asset", placeholder: "three draft picks and a blender" },
      { key: "source", label: "Unreliable source", placeholder: "a guy outside the stadium" },
      { key: "reaction", label: "Fan reaction", placeholder: "collective confusion" },
    ],
    build: (v, tone) =>
      `# Report: ${v.player} Headed to ${v.teamB} in Stunning Deal\n\n` +
      `According to ${v.source}, ${v.player} is on the move from ${v.teamA} to ${v.teamB} in exchange for ${v.asset}.\n\n` +
      `The report, which has the energy of pure ${tone.toLowerCase()} satire, triggered ${v.reaction} across the fanbase.\n\n` +
      `![trade graphic](https://placehold.co/1200x630/111827/fb923c/png?text=Trade+Rumor+Satire)\n\n` +
      `Insiders stress this is not real. That has never stopped a good rumor.`,
  },
];

export default function SatireLabPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("User");
  const [packIndex, setPackIndex] = useState(0);
  const [tone, setTone] = useState<(typeof TONES)[number]>("Funny");
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
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
    // reset inputs when pack changes
    const next: Record<string, string> = {};
    pack.fields.forEach((f) => {
      next[f.key] = "";
    });
    setValues(next);
    setDraft("");
    setTitle("");
    setMessage("");
    setPublishedId(null);
  }, [packIndex]);

  const canGenerate = useMemo(
    () => pack.fields.every((f) => (values[f.key] || "").trim().length > 0),
    [pack.fields, values]
  );

  const refreshPack = () => {
    setPackIndex((i) => (i + 1) % PROMPT_PACKS.length);
  };

  const generateDraft = () => {
    if (!canGenerate) {
      setMessage("Fill in every madlib field first.");
      return;
    }
    const cleaned: Record<string, string> = {};
    pack.fields.forEach((f) => {
      cleaned[f.key] = values[f.key].trim();
    });
    const body = pack.build(cleaned, tone);
    const firstLine = body.split("\n").find((l) => l.startsWith("# "));
    setTitle(firstLine ? firstLine.replace(/^#\s*/, "") : `${cleaned.star || cleaned.player || "Satire"} Report`);
    setDraft(body.replace(/^#.*\n\n/, ""));
    setMessage("Satire draft generated. Edit if you want, then publish.");
    setPublishedId(null);
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

  const publish = async () => {
    if (!userId) return;
    if (!title.trim() || !draft.trim()) {
      setMessage("Generate a draft first.");
      return;
    }
    setPublishing(true);
    setMessage("");
    try {
      const body =
        `![satire banner](https://placehold.co/1200x400/7c3aed/ffffff/png?text=SATIRE)\n\n` +
        draft.trim();

      const { data, error } = await supabase
        .from("articles")
        .insert({
          user_id: userId,
          title: title.trim(),
          section: "Satire",
          body,
          author_name: displayName,
        })
        .select("id")
        .single();

      if (error) {
        setMessage(`Publish failed: ${error.message}`);
      } else {
        await awardPoints(userId, data.id);
        setPublishedId(data.id);
        setMessage("Satire published. +5 points");
      }
    } catch {
      setMessage("Something went wrong while publishing.");
    } finally {
      setPublishing(false);
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
          Account required to generate and publish madlib-style satire.
        </p>
        <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-forge-accent text-white font-medium">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-200 text-xs font-semibold mb-3">
          SATIRE · clearly untrue
        </div>
        <h1 className="text-3xl font-bold mb-2">Satire Lab</h1>
        <p className="text-gray-300 text-sm">
          Madlib-style generation. Fill the blanks, pick a tone, generate a full satire draft with image placeholders.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5">
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
                Refresh setup
              </button>
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

            <div className="space-y-3">
              {pack.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-300 mb-1">{field.label}</label>
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
              onClick={generateDraft}
              disabled={!canGenerate}
              className="mt-5 w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm disabled:opacity-50"
            >
              Generate satire draft
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Later this will call real AI for richer writing and images. For now it’s template-driven so the flow works end-to-end.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 min-h-[420px]">
            <div className="text-sm text-gray-400 mb-2">Draft preview</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Generated title..."
              className="w-full bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm outline-none mb-3 font-semibold"
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Your generated satire will appear here..."
              className="w-full min-h-[280px] bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm outline-none leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={publish}
              disabled={publishing || !draft.trim()}
              className="px-5 py-2.5 rounded-xl bg-forge-accent text-white text-sm font-medium disabled:opacity-60"
            >
              {publishing ? "Publishing..." : "Publish as Satire (+5 pts)"}
            </button>
            <Link href="/" className="px-5 py-2.5 rounded-xl bg-black/20 text-sm">
              Back home
            </Link>
          </div>

          {message && <p className="text-sm text-yellow-200">{message}</p>}
          {publishedId && (
            <Link href={`/article/${publishedId}`} className="inline-block text-sm text-purple-200">
              View published satire →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
