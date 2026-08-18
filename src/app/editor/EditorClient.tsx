"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Classified = {
  section: "Sports" | "Pop Culture";
  subcategory: string;
};

type GateResult = {
  status: "published" | "author_only";
  reason: string;
};

function classifyArticle(title: string, body: string): Classified {
  const text = `${title} ${body}`.toLowerCase();

  const sportsRules: { sub: string; keys: string[] }[] = [
    { sub: "NFL", keys: ["nfl", "football", "quarterback", "touchdown", "super bowl"] },
    { sub: "MLB", keys: ["mlb", "baseball", "home run", "pitcher", "world series"] },
    { sub: "NBA", keys: ["nba", "basketball", "three-pointer", "finals"] },
    { sub: "NHL", keys: ["nhl", "hockey", "stanley cup", "goalie"] },
    { sub: "College Football", keys: ["college football", "cfb", "sec ", "big ten"] },
    { sub: "College Basketball", keys: ["march madness", "ncaa", "college basketball"] },
    { sub: "Golf", keys: ["golf", "pga", "masters", "fairway", "putt"] },
    { sub: "Soccer", keys: ["soccer", "mls", "premier league", "fifa", "world cup"] },
  ];

  const popRules: { sub: string; keys: string[] }[] = [
    { sub: "Film", keys: ["movie", "film", "box office", "director", "cinema"] },
    { sub: "TV", keys: ["tv", "television", "series", "episode", "streaming", "netflix", "hulu"] },
    { sub: "Music", keys: ["music", "album", "song", "concert", "grammy", "rapper", "singer"] },
    { sub: "Celebrity", keys: ["celebrity", "hollywood", "paparazzi", "red carpet"] },
    { sub: "Gaming", keys: ["game", "gaming", "xbox", "playstation", "nintendo", "esports"] },
  ];

  for (const rule of sportsRules) {
    if (rule.keys.some((k) => text.includes(k))) {
      return { section: "Sports", subcategory: rule.sub };
    }
  }

  for (const rule of popRules) {
    if (rule.keys.some((k) => text.includes(k))) {
      return { section: "Pop Culture", subcategory: rule.sub };
    }
  }

  return { section: "Pop Culture", subcategory: "General" };
}

// Low floor gate — later replace with real AI review
function qualityGate(title: string, body: string): GateResult {
  const t = title.trim();
  const b = body.trim();
  const chars = b.length;
  const words = b.split(/\s+/).filter(Boolean).length;

  if (t.length < 8) {
    return {
      status: "author_only",
      reason: "Headline too short for the public feed.",
    };
  }

  if (chars < 400 || words < 70) {
    return {
      status: "author_only",
      reason: "Body is too short for the public feed. Kept on your author desk only.",
    };
  }

  // ultra-thin repeated junk
  const uniqueRatio =
    new Set(b.toLowerCase().split(/\s+/).filter(Boolean)).size / Math.max(words, 1);
  if (uniqueRatio < 0.35 && words < 120) {
    return {
      status: "author_only",
      reason: "Content looks too thin/repetitive for the public feed.",
    };
  }

  return {
    status: "published",
    reason: "Cleared the public-feed quality floor.",
  };
}

export default function EditorClient() {
  const searchParams = useSearchParams();
  void searchParams.get("section");

  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [classified, setClassified] = useState<Classified | null>(null);
  const [gate, setGate] = useState<GateResult | null>(null);

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data.user));
      setChecking(false);
    };
    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const publish = async () => {
    setMessage("");
    setPublishedId(null);
    setClassified(null);
    setGate(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setMessage("Please log in to publish.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setMessage("Title and body are required.");
      return;
    }

    setPublishing(true);

    const result = classifyArticle(title.trim(), body.trim());
    const gateResult = qualityGate(title.trim(), body.trim());
    setClassified(result);
    setGate(gateResult);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const authorName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "User";

    const insertPayload: Record<string, unknown> = {
      title: title.trim(),
      body: body.trim(),
      section: result.section,
      subcategory: result.subcategory,
      status: gateResult.status,
      user_id: user.id,
      author_name: authorName,
    };

    let { data, error } = await supabase
      .from("articles")
      .insert(insertPayload)
      .select("id")
      .single();

    // tolerate missing optional columns on older schemas
    if (error) {
      const msg = String(error.message).toLowerCase();
      const fallback: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        section: result.section,
        user_id: user.id,
        author_name: authorName,
      };
      if (!msg.includes("status")) fallback.status = gateResult.status;
      if (!msg.includes("subcategory")) fallback.subcategory = result.subcategory;

      const retry = await supabase.from("articles").insert(fallback).select("id").single();
      data = retry.data;
      error = retry.error;
    }

    setPublishing(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data || !data.id) {
      setMessage("Saved, but no article id was returned.");
      return;
    }

    setPublishedId(data.id);

    if (gateResult.status === "published") {
      setMessage(
        `Published to public feed · ${result.section} / ${result.subcategory}. ${gateResult.reason}`
      );
    } else {
      setMessage(
        `Saved to your author desk only (not public). ${gateResult.reason}`
      );
    }

    setTitle("");
    setBody("");
  };

  if (checking) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-pit">
        Checking account...
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--pit-text)" }}>
          Editors only
        </h1>
        <p className="text-muted-pit mb-6">
          You need a theBallpit account to write articles, upload media, and use AI tools.
        </p>
        <Link href="/login" className="btn-write inline-block px-6 py-2.5 rounded-xl text-sm">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--pit-text)" }}>
        Write on theBallpit
      </h1>
      <p className="text-sm text-muted-pit mb-6">
        Submit the story. AI files Sports vs Pop Culture. A quality floor decides if it goes to the
        public feed or stays on your author desk only.
      </p>

      <div className="pit-panel p-5 space-y-4">
        <div>
          <label className="text-xs text-muted-pit block mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            placeholder="Headline"
          />
        </div>

        <div>
          <label className="text-xs text-muted-pit block mb-1">Article</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full rounded-xl px-3 py-2 text-sm"
            placeholder="Write your story..."
          />
          <p className="text-[11px] text-muted-pit mt-1">
            Public feed needs real substance (about 70+ words). Short posts stay author-only.
          </p>
        </div>

        <button
          type="button"
          onClick={publish}
          disabled={publishing}
          className="btn-write px-5 py-2.5 rounded-xl text-sm disabled:opacity-60"
        >
          {publishing ? "Scanning & saving..." : "Publish"}
        </button>

        {classified && (
          <div
            className="rounded-xl px-3 py-2 text-sm border"
            style={{
              borderColor: "color-mix(in srgb, var(--pit-highlight) 40%, transparent)",
              background: "color-mix(in srgb, var(--pit-highlight) 12%, transparent)",
            }}
          >
            Filing: <strong>{classified.section}</strong> · {classified.subcategory}
          </div>
        )}

        {gate && (
          <div
            className="rounded-xl px-3 py-2 text-sm border"
            style={{
              borderColor:
                gate.status === "published"
                  ? "color-mix(in srgb, #22c55e 45%, transparent)"
                  : "color-mix(in srgb, #eab308 45%, transparent)",
              background:
                gate.status === "published"
                  ? "color-mix(in srgb, #22c55e 12%, transparent)"
                  : "color-mix(in srgb, #eab308 12%, transparent)",
            }}
          >
            {gate.status === "published" ? "Public feed" : "Author desk only"} · {gate.reason}
          </div>
        )}

        {message && (
          <p className="text-sm text-muted-pit">
            {message}{" "}
            {publishedId && (
              <Link href={`/article/${publishedId}`} className="text-highlight-pit underline">
                View
              </Link>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
