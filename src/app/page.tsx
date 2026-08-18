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

  const loadArticleStats = async (articleIds: string[]) => {
    if (articleIds.length === 0) {
      setStatsById({});
      return;
    }

    const map: Record<string, ArticleStats> = {};
    articleIds.forEach((id) => {
      map[id] = { avgRating: null, ratingCount: 0, commentCount: 0 };
    });

    const { data: ratings } = await supabase
      .from("ratings")
      .select("article_id, stars")
      .in("article_id", articleIds);

    const sums: Record<string, { total: number; count: number }> = {};
    (ratings || []).forEach((r: any) => {
      if (!sums[r.article_id]) sums[r.article_id] = { total: 0, count: 0 };
      sums[r.article_id].total += Number(r.stars) || 0;
      sums[r.article_id].count += 1;
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

    setStatsById(map);
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

      // ai_score optional — if column missing, remove it from select
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, user_id, author_name, ai_score")
        .order("created_at", { ascending: false });

      if (error) {
        // fallback without ai_score column
        const { data: fallback } = await supabase
          .from("articles")
          .select("id, title, section, body, created_at, user_id, author_name")
          .order("created_at", { ascending: false });

        const mapped = (fallback || []).map((a: any) => ({ ...a, ai_score: null }));
        setArticles(mapped);
        await loadArticleStats(mapped.map((a) => a.id));

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
      } else if (data) {
        const mapped = data.map((a: any) => ({
          ...a,
          ai_score: a.ai_score == null ? null : Number(a.ai_score),
        }));
        setArticles(mapped);
        await loadArticleStats(mapped.map((a) => a.id));

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
            ai_score: a.ai_score == null ? null : Number(a.ai_score),
          }))
        );
      }
    }

    setSearching(false);
  };

  const addFavorite = async (favoriteUserId: string, name: string) => {
    if (!userId) return;
    const already = favorites.some((f) => f.favorite_user_id === favoriteUserId);
    if (already) {
      setSearchMessage(`${name} is already on your watchlist.`);
      return;
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: userId,
      favorite_user_id: favoriteUserId,
    });

    if (error) {
      setSearchMessage(error.message);
      return;
    }

    setSearchMessage(`Added ${name} to favorites.`);
    await loadFavoritesAndFeed(userId);
  };

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.favorite_user_id)),
    [favorites]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (onlyFavorites) n += 1;
    if (feedGens.length > 0) n += 1;
    return n;
  }, [onlyFavorites, feedGens]);

  const filteredArticles = useMemo(() => {
    let list = section === "All" ? articles : articles.filter((a) => a.section === section);

    if (loggedIn && onlyFavorites) {
      list = list.filter((a) => favoriteIds.has(a.user_id));
    }

    if (loggedIn && feedGens.length > 0) {
      list = list.filter((a) => {
        const gen = authorGens[a.user_id];
        return gen !== null && feedGens.includes(gen);
      });
    }

    return list;
  }, [articles, section, loggedIn, onlyFavorites, favoriteIds, feedGens, authorGens]);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const writeHref =
    section === "Satire"
      ? "/fan-fiction"
      : `/editor?section=${encodeURIComponent(section === "All" ? "Sports" : section)}`;

  const writeLabel =
    section === "All"
      ? "Write an article"
      : section === "Satire"
      ? "Write Satire"
      : `Write in ${section}`;

  const clearFilters = () => {
    setOnlyFavorites(false);
    setFeedGens([]);
  };

  const feedFiltering = feedGens.length > 0;

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-2">
          <div className="metal-card overflow-hidden">
            <img
              src="/ballpit-hero.png"
              alt="The Ballpit"
              className="w-full h-auto object-cover max-h-[360px] md:max-h-[420px]"
            />
          </div>
          <p className="text-center text-xs md:text-sm tracking-[0.22em] uppercase text-muted-pit mt-4 mb-4">
            Sports · Pop Culture · Satire
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start items-center">
          {(["All", "Sports", "Pop Culture", "Satire"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setSection(item)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition border ${
                section === item ? "btn-write border-transparent" : "btn-metal"
              }`}
            >
              {item}
            </button>
          ))}

          {loggedIn && (
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={`px-4 py-2 rounded-full text-sm font-medium btn-metal ${
                  activeFilterCount > 0 ? "ring-1 ring-[var(--pit-highlight)]" : ""
                }`}
              >
                Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
              </button>

              {filterOpen && (
                <div
                  className="absolute left-0 md:left-auto mt-2 w-80 rounded-xl border border-white/10 p-4 shadow-2xl z-40"
                  style={{
                    background: "color-mix(in srgb, var(--pit-panel) 94%, black 6%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-pit mb-3">
                    Feed filters
                  </div>

                  <label className="flex items-center justify-between gap-3 mb-4 text-sm cursor-pointer">
                    <span>Only favorites</span>
                    <input
                      type="checkbox"
                      checked={onlyFavorites}
                      onChange={(e) => setOnlyFavorites(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>

                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-pit">Generation</div>
                    <button
                      type="button"
                      onClick={() => setFeedGens([])}
                      className="text-[11px] text-muted-pit hover:opacity-80"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {GENERATIONS.map((g) => (
                      <GenChip
                        key={g.id}
                        label={g.label}
                        active={feedGens.includes(g.id)}
                        filtering={feedFiltering}
                        onClick={() => toggleFeedGen(g.id)}
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-muted-pit mb-3">
                    Selected stay on. Others get crossed out and hidden from the feed.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full text-xs px-3 py-2 rounded-lg btn-metal"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="pit-panel p-8 text-center text-muted-pit text-sm">Loading articles...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="pit-panel p-8 text-center text-muted-pit text-sm">
              No articles match this filter.
            </div>
          ) : (
            filteredArticles.map((article) => {
              const stats = statsById[article.id] || {
                avgRating: null,
                ratingCount: 0,
                commentCount: 0,
              };

              return (
                <article key={article.id} className="metal-card p-5 transition-all duration-200">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-pit mb-2">
                    <span className="bg-highlight-soft px-2 py-0.5 rounded-md font-semibold">
                      {article.section}
                    </span>
                    <span>{formatTime(article.created_at)}</span>
                    {authorGens[article.user_id] && (
                      <span className="px-2 py-0.5 rounded-md border border-white/10">
                        {authorGens[article.user_id]}
                      </span>
                    )}
                  </div>

                  <Link href={`/article/${article.id}`}>
                    <h2 className="text-lg md:text-xl font-bold mb-2 hover:opacity-90 transition leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-muted-pit text-sm line-clamp-3 mb-3 leading-relaxed">
                      {article.body}
                    </p>
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-pit mb-3">
                    <span title="AI quality score">
                      AI{" "}
                      <span className="font-semibold" style={{ color: "var(--pit-text)" }}>
                        {article.ai_score != null ? Number(article.ai_score).toFixed(1) : "—"}
                      </span>
                    </span>
                    <span title="Average user star rating">
                      ★{" "}
                      <span className="font-semibold" style={{ color: "var(--pit-text)" }}>
                        {stats.avgRating != null ? stats.avgRating.toFixed(1) : "—"}
                      </span>
                      <span className="ml-1">({stats.ratingCount})</span>
                    </span>
                    <span title="Comment count">
                      💬{" "}
                      <span className="font-semibold" style={{ color: "var(--pit-text)" }}>
                        {stats.commentCount}
                      </span>
                    </span>
                  </div>

                  {article.user_id ? (
                    <Link
                      href={`/profile/${article.user_id}`}
                      className="text-sm font-medium hover:opacity-80 text-highlight-pit"
                    >
                      {article.author_name || "Unknown author"}
                    </Link>
                  ) : (
                    <div className="text-sm font-medium">
                      {article.author_name || "Unknown author"}
                    </div>
                  )}
                </article>
              );
            })
          )}

          {loggedIn && (
            <div className="pt-4">
              <Link
                href={writeHref}
                className="btn-write inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 rounded-xl text-sm"
              >
                {writeLabel}
              </Link>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          {loggedIn ? (
            <>
              <div className="pit-panel p-5">
                <div className="flex items-center gap-3 mb-4">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{
                        background: "color-mix(in srgb, var(--pit-highlight) 75%, black 25%)",
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-pit">Your desk</div>
                    <div className="text-xl font-bold">{displayName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(0,0,0,0.15)" }}>
                    <div className="text-muted-pit text-xs">Points</div>
                    <div className="text-lg font-semibold text-highlight-pit">{points}</div>
                  </div>
                  <div className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(0,0,0,0.15)" }}>
                    <div className="text-muted-pit text-xs">AI Credits</div>
                    <div className="text-lg font-semibold">{aiCredits}</div>
                  </div>
                  <div className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(0,0,0,0.15)" }}>
                    <div className="text-muted-pit text-xs">Upvotes</div>
                    <div className="text-lg font-semibold text-green-400">{upReceived}</div>
                  </div>
                  <div className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(0,0,0,0.15)" }}>
                    <div className="text-muted-pit text-xs">Downvotes</div>
                    <div className="text-lg font-semibold text-red-400">{downReceived}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link href="/profile" className="text-highlight-pit hover:opacity-80">
                    Profile
                  </Link>
                  <Link href="/wallet" className="text-muted-pit hover:opacity-100">
                    Wallet
                  </Link>
                  <Link href="/favorites" className="text-muted-pit hover:opacity-100">
                    Manage favorites
                  </Link>
                </div>
              </div>

              <div className="pit-panel p-5">
                <h3 className="font-semibold mb-3">Watchlist activity</h3>
                {watchFeed.length === 0 ? (
                  <p className="text-sm text-muted-pit">
                    No watchlist activity yet. Favorite people to track them.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {watchFeed.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block rounded-xl border border-white/5 px-3 py-2 transition"
                        style={{ background: "rgba(0,0,0,0.12)" }}
                      >
                        <div className="text-xs text-muted-pit mb-1">
                          {item.kind === "article"
                            ? "Article"
                            : item.kind === "reply"
                            ? "Reply"
                            : "Comment"}{" "}
                          · {formatTime(item.created_at)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{item.actor_name}</span>{" "}
                          <span className="text-muted-pit">{item.summary}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="pit-panel p-5">
                <h3 className="font-semibold mb-3">Find</h3>

                <div className="space-y-2 mb-3">
                  <input
                    value={userNameQuery}
                    onChange={(e) => setUserNameQuery(e.target.value)}
                    placeholder="User display name"
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={userLocationQuery}
                    onChange={(e) => setUserLocationQuery(e.target.value)}
                    placeholder="User location"
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={topicQuery}
                    onChange={(e) => setTopicQuery(e.target.value)}
                    placeholder="Article topic"
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="btn-write w-full px-3 py-2.5 rounded-xl text-sm disabled:opacity-60"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>

                {searchMessage && <p className="text-xs text-yellow-500 mb-2">{searchMessage}</p>}

                {searchUsers.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-pit mb-2">
                      Users
                    </div>
                    <div className="space-y-2">
                      {searchUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-white/5 px-3 py-2"
                          style={{ background: "rgba(0,0,0,0.12)" }}
                        >
                          <div className="min-w-0">
                            <Link
                              href={`/profile/${u.id}`}
                              className="text-sm font-medium hover:opacity-80 block truncate"
                            >
                              {u.display_name}
                            </Link>
                            <div className="text-[11px] text-muted-pit truncate">
                              {u.location || "No location"}
                            </div>
                          </div>
                          {!favoriteIds.has(u.id) && (
                            <button
                              onClick={() => addFavorite(u.id, u.display_name)}
                              className="text-xs px-2 py-1 rounded-lg btn-write shrink-0"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {topicArticles.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-pit mb-2">
                      Articles
                    </div>
                    <div className="space-y-2">
                      {topicArticles.map((a) => (
                        <Link
                          key={a.id}
                          href={`/article/${a.id}`}
                          className="block rounded-lg border border-white/5 px-3 py-2"
                          style={{ background: "rgba(0,0,0,0.12)" }}
                        >
                          <div className="text-sm font-medium truncate">{a.title}</div>
                          <div className="text-[11px] text-muted-pit truncate">
                            {a.section} · {a.author_name || "Unknown"} · {formatTime(a.created_at)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="pit-panel p-5 text-center">
              <p
                className="text-xl font-bold mb-2 tracking-wide"
                style={{
                  background: "linear-gradient(180deg, #F4F6F7 0%, #C8CDD2 42%, #8B9298 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.55))",
                }}
              >
                Want to jump in?
              </p>
              <p className="text-sm text-muted-pit mb-4">
                Create an account to write articles and use AI tools.
              </p>
              <Link href="/login" className="btn-write inline-block px-6 py-2.5 rounded-xl text-sm">
                Log in / Sign up
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
