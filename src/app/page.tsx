"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatTime } from "@/lib/time";

type Article = {
  id: string;
  title: string;
  section: string;
  body: string;
  created_at: string;
  user_id: string;
  author_name: string | null;
  ai_score: number | null;
};

type ArticleStats = {
  avgRating: number | null;
  ratingCount: number;
  commentCount: number;
};

type AuthorRating = {
  avg: number | null;
  count: number;
};

type Favorite = {
  favorite_user_id: string;
  display_name: string;
};

type WatchItem = {
  id: string;
  kind: "article" | "comment" | "reply";
  actor_name: string;
  summary: string;
  href: string;
  created_at: string;
};

type SearchUser = {
  id: string;
  display_name: string;
  location: string | null;
};

type Generation = "Silent" | "Boomer" | "Gen X" | "Millennial" | "Gen Z" | "Gen Alpha";

const GENERATIONS: { id: Generation; label: string; start: number; end: number }[] = [
  { id: "Silent", label: "Silent", start: 1928, end: 1945 },
  { id: "Boomer", label: "Boomer", start: 1946, end: 1964 },
  { id: "Gen X", label: "Gen X", start: 1965, end: 1980 },
  { id: "Millennial", label: "Millennial", start: 1981, end: 1996 },
  { id: "Gen Z", label: "Gen Z", start: 1997, end: 2012 },
  { id: "Gen Alpha", label: "Gen Alpha", start: 2013, end: 2030 },
];

function generationFromBirthday(birthday: string | null | undefined): Generation | null {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const hit = GENERATIONS.find((g) => year >= g.start && year <= g.end);
  return hit ? hit.id : null;
}

function GenChip({
  label,
  active,
  filtering,
  onClick,
}: {
  label: string;
  active: boolean;
  filtering: boolean;
  onClick: () => void;
}) {
  const filteredOut = filtering && !active;

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-xs font-medium transition border"
      style={{
        borderColor: active
          ? "color-mix(in srgb, var(--pit-highlight) 70%, transparent)"
          : "rgba(255,255,255,0.12)",
        background: active
          ? "color-mix(in srgb, var(--pit-highlight) 22%, transparent)"
          : "rgba(255,255,255,0.04)",
        color: filteredOut ? "var(--pit-muted)" : "var(--pit-text)",
        textDecoration: filteredOut ? "line-through" : "none",
        opacity: filteredOut ? 0.55 : 1,
        boxShadow: active
          ? "0 0 0 1px color-mix(in srgb, var(--pit-highlight) 35%, transparent)"
          : "none",
      }}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const [section, setSection] = useState<"All" | "Sports" | "Pop Culture" | "Satire">("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [statsById, setStatsById] = useState<Record<string, ArticleStats>>({});
  const [authorRatings, setAuthorRatings] = useState<Record<string, AuthorRating>>({});
  const [authorGens, setAuthorGens] = useState<Record<string, Generation | null>>({});
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [points, setPoints] = useState(0);
  const [aiCredits, setAiCredits] = useState(0);
  const [upReceived, setUpReceived] = useState(0);
  const [downReceived, setDownReceived] = useState(0);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [watchFeed, setWatchFeed] = useState<WatchItem[]>([]);

  const [userNameQuery, setUserNameQuery] = useState("");
  const [userLocationQuery, setUserLocationQuery] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [topicArticles, setTopicArticles] = useState<Article[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [feedGens, setFeedGens] = useState<Generation[]>([]);
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const toggleFeedGen = (g: Generation) => {
    setFeedGens((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const loadArticleStats = async (list: Article[]) => {
    const articleIds = list.map((a) => a.id);
    if (articleIds.length === 0) {
      setStatsById({});
      setAuthorRatings({});
      return;
    }

    const map: Record<string, ArticleStats> = {};
    articleIds.forEach((id) => {
      map[id] = { avgRating: null, ratingCount: 0, commentCount: 0 };
    });

    const articleOwner: Record<string, string> = {};
    list.forEach((a) => {
      if (a.user_id) articleOwner[a.id] = a.user_id;
    });

    const { data: ratings } = await supabase
      .from("ratings")
      .select("article_id, stars")
      .in("article_id", articleIds);

    const sums: Record<string, { total: number; count: number }> = {};
    const authorSums: Record<string, { total: number; count: number }> = {};

    (ratings || []).forEach((r: any) => {
      if (!sums[r.article_id]) sums[r.article_id] = { total: 0, count: 0 };
      const stars = Number(r.stars) || 0;
      sums[r.article_id].total += stars;
      sums[r.article_id].count += 1;

      const owner = articleOwner[r.article_id];
      if (owner) {
        if (!authorSums[owner]) authorSums[owner] = { total: 0, count: 0 };
        authorSums[owner].total += stars;
        authorSums[owner].count += 1;
      }
    });

    Object.keys(sums).forEach((id) => {
      map[id].ratingCount = sums[id].count;
      map[id].avgRating = sums[id].count ? sums[id].total / sums[id].count : null;
    });

    const { data: comments } = await supabase
      .from("comments")
      .select("article_id")
      .in("article_id", articleIds);

    (comments || []).forEach((c: any) => {
      if (map[c.article_id]) map[c.article_id].commentCount += 1;
    });

    const aMap: Record<string, AuthorRating> = {};
    Object.keys(authorSums).forEach((uid) => {
      aMap[uid] = {
        count: authorSums[uid].count,
        avg: authorSums[uid].count
          ? authorSums[uid].total / authorSums[uid].count
          : null,
      };
    });

    setStatsById(map);
    setAuthorRatings(aMap);
  };

  const loadFavoritesAndFeed = async (uid: string) => {
    const { data: favRows } = await supabase
      .from("favorites")
      .select("favorite_user_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    const favList: Favorite[] = [];
    const favIds: string[] = [];
    for (const row of favRows || []) {
      favIds.push(row.favorite_user_id);
      const { data: favProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", row.favorite_user_id)
        .maybeSingle();
      favList.push({
        favorite_user_id: row.favorite_user_id,
        display_name: favProfile?.display_name || "User",
      });
    }
    setFavorites(favList);

    const feed: WatchItem[] = [];
    if (favIds.length > 0) {
      const { data: favArticles } = await supabase
        .from("articles")
        .select("id, title, author_name, created_at, user_id")
        .in("user_id", favIds)
        .order("created_at", { ascending: false })
        .limit(12);

      (favArticles || []).forEach((a) => {
        feed.push({
          id: `a-${a.id}`,
          kind: "article",
          actor_name: a.author_name || "User",
          summary: `published “${a.title}”`,
          href: `/article/${a.id}`,
          created_at: a.created_at,
        });
      });

      const { data: favComments } = await supabase
        .from("comments")
        .select("id, body, author_name, article_id, created_at, user_id, parent_id")
        .in("user_id", favIds)
        .order("created_at", { ascending: false })
        .limit(20);

      (favComments || []).forEach((c) => {
        const isReply = Boolean(c.parent_id);
        feed.push({
          id: `c-${c.id}`,
          kind: isReply ? "reply" : "comment",
          actor_name: c.author_name || "User",
          summary: `${isReply ? "replied" : "commented"}: ${c.body.slice(0, 80)}${
            c.body.length > 80 ? "…" : ""
          }`,
          href: `/article/${c.article_id}`,
          created_at: c.created_at,
        });
      });

      feed.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setWatchFeed(feed.slice(0, 15));
    } else {
      setWatchFeed([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      setLoggedIn(Boolean(user));
      setUserId(user?.id || null);

      const { data, error } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, user_id, author_name, ai_score")
        .order("created_at", { ascending: false });

      let mapped: Article[] = [];

      if (error) {
        const { data: fallback } = await supabase
          .from("articles")
          .select("id, title, section, body, created_at, user_id, author_name")
          .order("created_at", { ascending: false });
        mapped = (fallback || []).map((a: any) => ({ ...a, ai_score: null }));
      } else {
        mapped = (data || []).map((a: any) => ({
          ...a,
          ai_score: a.ai_score == null ? null : Number(a.ai_score),
        }));
      }

      setArticles(mapped);
      await loadArticleStats(mapped);

      const ids = Array.from(new Set(mapped.map((a) => a.user_id).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, birthday")
          .in("id", ids);
        const genMap: Record<string, Generation | null> = {};
        (profiles || []).forEach((p) => {
          genMap[p.id] = generationFromBirthday(p.birthday);
        });
        ids.forEach((id) => {
          if (!(id in genMap)) genMap[id] = null;
        });
        setAuthorGens(genMap);
      }

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, points, ai_credits, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        const name =
          profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "User";

        setDisplayName(name);
        setAvatarUrl(profile?.avatar_url || "");
        setPoints(profile?.points ?? 0);
        setAiCredits(profile?.ai_credits ?? 0);

        const { data: myComments } = await supabase
          .from("comments")
          .select("id")
          .eq("user_id", user.id);
        const commentIds = (myComments || []).map((c) => c.id);
        if (commentIds.length > 0) {
          const { data: votes } = await supabase
            .from("comment_votes")
            .select("vote")
            .in("comment_id", commentIds);
          let up = 0;
          let down = 0;
          (votes || []).forEach((v) => {
            if (v.vote === 1) up += 1;
            if (v.vote === -1) down += 1;
          });
          setUpReceived(up);
          setDownReceived(down);
        }

        await loadFavoritesAndFeed(user.id);
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleSearch = async () => {
    if (!userId) return;
    setSearchMessage("");
    setSearchUsers([]);
    setTopicArticles([]);
    setSearching(true);

    const nameQ = userNameQuery.trim();
    const locQ = userLocationQuery.trim();
    const topicQ = topicQuery.trim();

    if (!nameQ && !locQ && !topicQ) {
      setSearchMessage("Enter a display name, location, or article topic.");
      setSearching(false);
      return;
    }

    if (nameQ || locQ) {
      let query = supabase
        .from("profiles")
        .select("id, display_name, location")
        .neq("id", userId)
        .limit(30);

      if (nameQ) query = query.ilike("display_name", `%${nameQ}%`);
      if (locQ) query = query.ilike("location", `%${locQ}%`);

      const { data, error } = await query;
      if (error) {
        setSearchMessage(error.message);
        setSearching(false);
        return;
      }

      setSearchUsers(
        (data || []).map((u) => ({
          id: u.id,
          display_name: u.display_name || "User",
          location: u.location || null,
        }))
      );
    }

    if (topicQ) {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, user_id, author_name, ai_score")
        .or(`title.ilike.%${topicQ}%,body.ilike.%${topicQ}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        const { data: fallback } = await supabase
          .from("articles")
          .select("id, title, section, body, created_at, user_id, author_name")
          .or(`title.ilike.%${topicQ}%,body.ilike.%${topicQ}%`)
          .order("created_at", { ascending: false })
          .limit(20);
        setTopicArticles((fallback || []).map((a: any) => ({ ...a, ai_score: null })));
      } else {
        setTopicArticles(
          (data || []).map((a: any) => ({
            ...a,
            ai_score: a.ai_score ==
