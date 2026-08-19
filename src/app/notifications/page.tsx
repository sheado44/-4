"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatTime, formatTimeFull } from "@/lib/time";

type PrefKey =
  | "favorite_articles"
  | "my_article_comments"
  | "replies_to_me"
  | "moshpit_replies"
  | "watchlist";

type Prefs = Record<PrefKey, boolean>;

type Item = {
  id: string;
  kind: PrefKey;
  title: string;
  detail: string;
  href: string;
  created_at: string;
};

const DEFAULT_PREFS: Prefs = {
  favorite_articles: true,
  my_article_comments: true,
  replies_to_me: true,
  moshpit_replies: true,
  watchlist: false,
};

const LABELS: { key: PrefKey; label: string; hint: string }[] = [
  { key: "favorite_articles", label: "Favorites published", hint: "New articles from people on the favorites list" },
  { key: "my_article_comments", label: "Comments on my articles", hint: "Someone talks on a piece I wrote" },
  { key: "replies_to_me", label: "Replies to my comments", hint: "Someone answers me under an article" },
  { key: "moshpit_replies", label: "theMoshpit replies", hint: "Someone answers a post of mine in theMoshpit" },
  { key: "watchlist", label: "Watchlist activity", hint: "Favorites leave new comments anywhere" },
];

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const persist = async (next: Prefs, uid: string | null) => {
    localStorage.setItem("ballpit-notify-prefs", JSON.stringify(next));
    if (!uid) return;
    await supabase.from("profiles").update({ notification_prefs: next }).eq("id", uid);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setUserId(null);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    let nextPrefs = { ...DEFAULT_PREFS };
    try {
      const raw = localStorage.getItem("ballpit-notify-prefs");
      if (raw) nextPrefs = { ...nextPrefs, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.notification_prefs && typeof profile.notification_prefs === "object") {
      nextPrefs = { ...nextPrefs, ...profile.notification_prefs };
    }
    setPrefs(nextPrefs);

    const gathered: Item[] = [];

    if (nextPrefs.favorite_articles) {
      const { data: favs } = await supabase
        .from("favorites")
        .select("favorite_user_id")
        .eq("user_id", user.id);
      const ids = (favs || []).map((f) => f.favorite_user_id).filter(Boolean);
      if (ids.length) {
        const { data: arts } = await supabase
          .from("articles")
          .select("id, title, author_name, created_at, user_id")
          .in("user_id", ids)
          .neq("status", "author_only")
          .order("created_at", { ascending: false })
          .limit(20);
        for (const a of arts || []) {
          gathered.push({
            id: `art-${a.id}`,
            kind: "favorite_articles",
            title: a.author_name || "Favorite",
            detail: `published ${a.title}`,
            href: `/article/${a.id}`,
            created_at: a.created_at,
          });
        }
      }
    }

    const { data: myArts } = await supabase
      .from("articles")
      .select("id, title")
      .eq("user_id", user.id);
    const myArtIds = (myArts || []).map((a) => a.id);
    const titleByArt: Record<string, string> = {};
    (myArts || []).forEach((a) => {
      titleByArt[a.id] = a.title;
    });

    if (nextPrefs.my_article_comments && myArtIds.length) {
      const { data: comments } = await supabase
        .from("comments")
        .select("id, article_id, author_name, body, created_at, user_id")
        .in("article_id", myArtIds)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      for (const c of comments || []) {
        gathered.push({
          id: `c-${c.id}`,
          kind: "my_article_comments",
          title: c.author_name || "Someone",
          detail: `commented on ${titleByArt[c.article_id] || "your article"}`,
          href: `/article/${c.article_id}#comments`,
          created_at: c.created_at,
        });
      }
    }

    if (nextPrefs.replies_to_me) {
      const { data: mine } = await supabase
        .from("comments")
        .select("id")
        .eq("user_id", user.id);
      const myCommentIds = (mine || []).map((c) => c.id);
      if (myCommentIds.length) {
        const { data: replies } = await supabase
          .from("comments")
          .select("id, article_id, author_name, body, created_at, parent_id")
          .in("parent_id", myCommentIds)
          .order("created_at", { ascending: false })
          .limit(30);
        for (const c of replies || []) {
          gathered.push({
            id: `r-${c.id}`,
            kind: "replies_to_me",
            title: c.author_name || "Someone",
            detail: "replied to your comment",
            href: `/article/${c.article_id}#comments`,
            created_at: c.created_at,
          });
        }
      }
    }

    if (nextPrefs.moshpit_replies) {
      const { data: mine } = await supabase
        .from("moshpit_posts")
        .select("id, body")
        .eq("user_id", user.id)
        .is("parent_id", null);
      const myPostIds = (mine || []).map((p) => p.id);
      if (myPostIds.length) {
        const { data: replies } = await supabase
          .from("moshpit_posts")
          .select("id, author_name, body, created_at")
          .in("parent_id", myPostIds)
          .order("created_at", { ascending: false })
          .limit(30);
        for (const p of replies || []) {
          gathered.push({
            id: `m-${p.id}`,
            kind: "moshpit_replies",
            title: p.author_name || "Someone",
            detail: "replied in theMoshpit",
            href: "/moshpit",
            created_at: p.created_at,
          });
        }
      }
    }

    if (nextPrefs.watchlist) {
      const { data: favs } = await supabase
        .from("favorites")
        .select("favorite_user_id")
        .eq("user_id", user.id);
      const ids = (favs || []).map((f) => f.favorite_user_id).filter(Boolean);
      if (ids.length) {
        const { data: comments } = await supabase
          .from("comments")
          .select("id, article_id, author_name, created_at, user_id")
          .in("user_id", ids)
          .order("created_at", { ascending: false })
          .limit(20);
        for (const c of comments || []) {
          gathered.push({
            id: `w-${c.id}`,
            kind: "watchlist",
            title: c.author_name || "Watchlist",
            detail: "left a comment",
            href: `/article/${c.article_id}#comments`,
            created_at: c.created_at,
          });
        }
      }
    }

    gathered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    setItems(gathered.slice(0, 50));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (key: PrefKey) => {
    if (!userId) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await persist(next, userId);
    setMessage("Preferences saved.");
    load();
  };

  if (!loading && !userId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold mb-3">Notifications</h1>
        <p className="text-sm text-muted-pit">
          A theBallpit account is required.{" "}
          <Link href="/login" className="text-highlight-pit">
            Log in
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-2">Notifications</h1>
      <p className="text-sm text-muted-pit mb-6">
        Pick what shows up. This stays in theBallpit — no email.
      </p>

      <div className="pit-panel p-4 mb-6 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Custom mix</div>
        {LABELS.map((row) => (
          <label key={row.key} className="flex items-start justify-between gap-3 text-sm">
            <span>
              <span className="block" style={{ color: "var(--pit-text)" }}>
                {row.label}
              </span>
              <span className="block text-[11px] text-muted-pit">{row.hint}</span>
            </span>
            <input
              type="checkbox"
              checked={prefs[row.key]}
              onChange={() => toggle(row.key)}
              className="h-4 w-4 mt-1"
            />
          </label>
        ))}
        {message && <p className="text-xs text-muted-pit">{message}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-muted-pit">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-pit">Nothing in this mix yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block pit-panel p-4 hover:opacity-95"
            >
              <div className="text-[11px] text-muted-pit mb-1" title={formatTimeFull(item.created_at)}>
                {LABELS.find((l) => l.key === item.kind)?.label} · {formatTime(item.created_at)}
              </div>
              <div className="text-sm">
                <span className="font-semibold">{item.title}</span>{" "}
                <span className="text-muted-pit">{item.detail}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
