"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatTime, formatTimeFull } from "@/lib/time";

export type PrefKey =
  | "favorite_articles"
  | "my_article_comments"
  | "replies_to_me"
  | "moshpit_replies"
  | "watchlist";

export type Prefs = Record<PrefKey, boolean>;

export type LogItem = {
  id: string;
  kind: PrefKey;
  created_at: string;
  party: string;
  partyId?: string | null;
  content: string;
  href: string;
};

export const DEFAULT_PREFS: Prefs = {
  favorite_articles: true,
  my_article_comments: true,
  replies_to_me: true,
  moshpit_replies: true,
  watchlist: false,
};

export const PREF_LABELS: { key: PrefKey; label: string; hint: string }[] = [
  { key: "favorite_articles", label: "Favorites published", hint: "New articles from favorites" },
  { key: "my_article_comments", label: "Comments on my articles", hint: "Talk on a piece I wrote" },
  { key: "replies_to_me", label: "Replies to my comments", hint: "Answers under an article" },
  { key: "moshpit_replies", label: "theMoshpit replies", hint: "Answers on my pit posts" },
  { key: "watchlist", label: "Watchlist activity", hint: "Favorites commenting anywhere" },
];

function clip(text: string, n = 90) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t || "—";
  return t.slice(0, n) + "…";
}

export async function loadNotifyPrefs(userId: string): Promise<Prefs> {
  let next = { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem("ballpit-notify-prefs");
    if (raw) next = { ...next, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.notification_prefs && typeof profile.notification_prefs === "object") {
    next = { ...next, ...profile.notification_prefs };
  }
  return next;
}

export async function saveNotifyPrefs(userId: string, prefs: Prefs) {
  localStorage.setItem("ballpit-notify-prefs", JSON.stringify(prefs));
  await supabase.from("profiles").update({ notification_prefs: prefs }).eq("id", userId);
}

export async function fetchNotificationLog(userId: string, prefs: Prefs): Promise<LogItem[]> {
  const gathered: LogItem[] = [];

  if (prefs.favorite_articles) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("favorite_user_id")
      .eq("user_id", userId);
    const ids = (favs || []).map((f) => f.favorite_user_id).filter(Boolean);
    if (ids.length) {
      const { data: arts } = await supabase
        .from("articles")
        .select("id, title, body, author_name, created_at, user_id")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(20);
      for (const a of arts || []) {
        if ((a as { status?: string }).status === "author_only") continue;
        gathered.push({
          id: `art-${a.id}`,
          kind: "favorite_articles",
          created_at: a.created_at,
          party: a.author_name || "Favorite",
          partyId: a.user_id,
          content: a.title || clip(a.body || ""),
          href: `/article/${a.id}`,
        });
      }
    }
  }

  const { data: myArts } = await supabase
    .from("articles")
    .select("id, title")
    .eq("user_id", userId);
  const myArtIds = (myArts || []).map((a) => a.id);
  const titleByArt: Record<string, string> = {};
  (myArts || []).forEach((a) => {
    titleByArt[a.id] = a.title;
  });

  if (prefs.my_article_comments && myArtIds.length) {
    const { data: comments } = await supabase
      .from("comments")
      .select("id, article_id, author_name, body, created_at, user_id")
      .in("article_id", myArtIds)
      .order("created_at", { ascending: false })
      .limit(30);
    for (const c of comments || []) {
      if (c.user_id === userId) continue;
      gathered.push({
        id: `c-${c.id}`,
        kind: "my_article_comments",
        created_at: c.created_at,
        party: c.author_name || "Someone",
        partyId: c.user_id,
        content: `${clip(c.body)} · on ${titleByArt[c.article_id] || "your article"}`,
        href: `/article/${c.article_id}#comments`,
      });
    }
  }

  if (prefs.replies_to_me) {
    const { data: mine } = await supabase.from("comments").select("id").eq("user_id", userId);
    const myCommentIds = (mine || []).map((c) => c.id);
    if (myCommentIds.length) {
      const { data: replies } = await supabase
        .from("comments")
        .select("id, article_id, author_name, body, created_at, user_id, parent_id")
        .in("parent_id", myCommentIds)
        .order("created_at", { ascending: false })
        .limit(30);
      for (const c of replies || []) {
        gathered.push({
          id: `r-${c.id}`,
          kind: "replies_to_me",
          created_at: c.created_at,
          party: c.author_name || "Someone",
          partyId: c.user_id,
          content: clip(c.body),
          href: `/article/${c.article_id}#comments`,
        });
      }
    }
  }

  if (prefs.moshpit_replies) {
    const { data: mine } = await supabase
      .from("moshpit_posts")
      .select("id, body")
      .eq("user_id", userId)
      .is("parent_id", null);
    const myPostIds = (mine || []).map((p) => p.id);
    if (myPostIds.length) {
      const { data: replies } = await supabase
        .from("moshpit_posts")
        .select("id, author_name, body, created_at, user_id")
        .in("parent_id", myPostIds)
        .order("created_at", { ascending: false })
        .limit(30);
      for (const p of replies || []) {
        gathered.push({
          id: `m-${p.id}`,
          kind: "moshpit_replies",
          created_at: p.created_at,
          party: p.author_name || "Someone",
          partyId: p.user_id,
          content: clip(p.body),
          href: "/moshpit",
        });
      }
    }
  }

  if (prefs.watchlist) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("favorite_user_id")
      .eq("user_id", userId);
    const ids = (favs || []).map((f) => f.favorite_user_id).filter(Boolean);
    if (ids.length) {
      const { data: comments } = await supabase
        .from("comments")
        .select("id, article_id, author_name, body, created_at, user_id")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(20);
      for (const c of comments || []) {
        gathered.push({
          id: `w-${c.id}`,
          kind: "watchlist",
          created_at: c.created_at,
          party: c.author_name || "Watchlist",
          partyId: c.user_id,
          content: clip(c.body),
          href: `/article/${c.article_id}#comments`,
        });
      }
    }
  }

  gathered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return gathered.slice(0, 50);
}

export default function NotificationLog({
  userId,
  prefs,
  compact = false,
}: {
  userId: string;
  prefs: Prefs;
  compact?: boolean;
}) {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchNotificationLog(userId, prefs).then((rows) => {
      if (!alive) return;
      setItems(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [userId, JSON.stringify(prefs)]);

  if (loading) return <p className="text-sm text-muted-pit">Loading log...</p>;
  if (items.length === 0) return <p className="text-sm text-muted-pit">No events in this mix yet.</p>;

  return (
    <div className="space-y-2">
      {items.slice(0, compact ? 8 : 50).map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-white/10 px-3 py-2.5"
          style={{ background: "rgba(0,0,0,0.16)" }}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-pit mb-1">
            <span title={formatTimeFull(item.created_at)}>{formatTime(item.created_at)}</span>
            <span>·</span>
            <span>{PREF_LABELS.find((l) => l.key === item.kind)?.label}</span>
          </div>
          <div className="text-sm leading-snug">
            {item.partyId ? (
              <Link href={`/profile/${item.partyId}`} className="font-semibold hover:opacity-80">
                {item.party}
              </Link>
            ) : (
              <span className="font-semibold">{item.party}</span>
            )}
            <span className="text-muted-pit"> · {item.content}</span>
          </div>
          <Link href={item.href} className="inline-block mt-1 text-xs text-highlight-pit">
            Open →
          </Link>
        </div>
      ))}
    </div>
  );
}


export function AlertsDeskWidget({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadNotifyPrefs(userId).then((p) => {
      setPrefs(p);
      setReady(true);
    });
  }, [userId]);

  return (
    <div className="pit-panel p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold">Event log</h3>
        <Link href="/notifications" className="text-xs text-highlight-pit">
          Customize
        </Link>
      </div>
      {ready ? <NotificationLog userId={userId} prefs={prefs} compact /> : (
        <p className="text-sm text-muted-pit">Loading log...</p>
      )}
    </div>
  );
}
