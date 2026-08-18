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
  age: number | null;
  generation: Generation | null;
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

function ageFromBirthday(birthday: string | null | undefined): number | null {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function generationFromBirthday(birthday: string | null | undefined): Generation | null {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const hit = GENERATIONS.find((g) => year >= g.start && year <= g.end);
  return hit ? hit.id : null;
}

export default function Home() {
  const [section, setSection] = useState<"All" | "Sports" | "Pop Culture" | "Satire">("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [authorAges, setAuthorAges] = useState<Record<string, number | null>>({});
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

  // Find users
  const [finderMinAge, setFinderMinAge] = useState(18);
  const [finderMaxAge, setFinderMaxAge] = useState(65);
  const [finderFavoritesOnly, setFinderFavoritesOnly] = useState(false);
  const [finderGens, setFinderGens] = useState<Generation[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);

  // Feed filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [feedAgeEnabled, setFeedAgeEnabled] = useState(false);
  const [feedAgeMin, setFeedAgeMin] = useState("");
  const [feedAgeMax, setFeedAgeMax] = useState("");
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

  const toggleFinderGen = (g: Generation) => {
    setFinderGens((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
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
        .select("id, title, section, body, created_at, user_id, author_name")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setArticles(data);

        const ids = Array.from(new Set(data.map((a) => a.user_id).filter(Boolean)));
        if (ids.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, birthday")
            .in("id", ids);

          const ageMap: Record<string, number | null> = {};
          const genMap: Record<string, Generation | null> = {};
          (profiles || []).forEach((p) => {
            ageMap[p.id] = ageFromBirthday(p.birthday);
            genMap[p.id] = generationFromBirthday(p.birthday);
          });
          ids.forEach((id) => {
            if (!(id in ageMap)) ageMap[id] = null;
            if (!(id in genMap)) genMap[id] = null;
          });
          setAuthorAges(ageMap);
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

  const handleFindUsers = async () => {
    if (!userId) return;
    setSearchMessage("");
    setSearchResults([]);
    setSearching(true);

    const min = Math.min(finderMinAge, finderMaxAge);
    const max = Math.max(finderMinAge, finderMaxAge);

    const mapRows = (data: any[]) =>
      (data || [])
        .map((u) => ({
          id: u.id,
          display_name: u.display_name || "User",
          location: u.location || null,
          age: ageFromBirthday(u.birthday),
          generation: generationFromBirthday(u.birthday),
        }))
        .filter((u) => {
          if (u.age === null) return false;
          if (u.age < min || u.age > max) return false;
          if (finderGens.length > 0 && (!u.generation || !finderGens.includes(u.generation))) {
            return false;
          }
          return true;
        });

    if (finderFavoritesOnly) {
      if (favorites.length === 0) {
        setSearchMessage("No favorites yet.");
        setSearching(false);
        return;
      }
      const ids = favorites.map((f) => f.favorite_user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, location, birthday")
        .in("id", ids);

      if (error) {
        setSearchMessage(error.message);
        setSearching(false);
        return;
      }

      const rows = mapRows(data || []);
      setSearchResults(rows);
      if (rows.length === 0) setSearchMessage("No matches in favorites.");
      setSearching(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, location, birthday")
      .neq("id", userId)
      .limit(120);

    if (error) {
      setSearchMessage(error.message);
      setSearching(false);
      return;
    }

    const rows = mapRows(data || []).slice(0, 20);
    setSearchResults(rows);
    if (rows.length === 0) setSearchMessage("No users match those filters.");
    setSearching(false);
  };

  const onMinAge = (v: number) => {
    setFinderMinAge(v);
    if (v > finderMaxAge) setFinderMaxAge(v);
  };
  const onMaxAge = (v: number) => {
    setFinderMaxAge(v);
    if (v < finderMinAge) setFinderMinAge(v);
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
    if (feedAgeEnabled) n += 1;
    if (feedGens.length > 0) n += 1;
    return n;
  }, [onlyFavorites, feedAgeEnabled, feedGens]);

  const filteredArticles = useMemo(() => {
    let list = section === "All" ? articles : articles.filter((a) => a.section === section);

    if (loggedIn && onlyFavorites) {
      list = list.filter((a) => favoriteIds.has(a.user_id));
    }

    if (loggedIn && feedAgeEnabled) {
      const min = feedAgeMin ? Number(feedAgeMin) : null;
      const max = feedAgeMax ? Number(feedAgeMax) : null;
      list = list.filter((a) => {
        const age = authorAges[a.user_id];
        if (age === null || age === undefined) return false;
        if (min !== null && !Number.isNaN(min) && age < min) return false;
        if (max !== null && !Number.isNaN(max) && age > max) return false;
        return true;
      });
    }

    if (loggedIn && feedGens.length > 0) {
      list = list.filter((a) => {
        const gen = authorGens[a.user_id];
        return gen !== null && feedGens.includes(gen);
      });
    }

    return list;
  }, [
    articles,
    section,
    loggedIn,
    onlyFavorites,
    favoriteIds,
    feedAgeEnabled,
    feedAgeMin,
    feedAgeMax,
    authorAges,
    feedGens,
    authorGens,
  ]);

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
    setFeedAgeEnabled(false);
    setFeedAgeMin("");
    setFeedAgeMax("");
    setFeedGens([]);
  };

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

                  <label className="flex items-center justify-between gap-3 mb-3 text-sm cursor-pointer">
                    <span>Publisher age range</span>
                    <input
                      type="checkbox"
                      checked={feedAgeEnabled}
                      onChange={(e) => setFeedAgeEnabled(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <input
                      value={feedAgeMin}
                      onChange={(e) => setFeedAgeMin(e.target.value)}
                      placeholder="Min age"
                      inputMode="numeric"
                      disabled={!feedAgeEnabled}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-40"
                    />
                    <input
                      value={feedAgeMax}
                      onChange={(e) => setFeedAgeMax(e.target.value)}
                      placeholder="Max age"
                      inputMode="numeric"
                      disabled={!feedAgeEnabled}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-40"
                    />
                  </div>

                  <div className="text-xs text-muted-pit mb-2">Generation</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {GENERATIONS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleFeedGen(g.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs btn-metal ${
                          feedGens.includes(g.id) ? "ring-1 ring-[var(--pit-highlight)]" : ""
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-muted-pit mb-3">
                    From birthday year · Boomer 46–64 · Gen X 65–80 · Millennial 81–96 · Gen Z 97–12
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
            filteredArticles.map((article) => (
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
                  {authorAges[article.user_id] != null && (
                    <span>Age {authorAges[article.user_id]}</span>
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

                <div className="text-sm font-medium">{article.author_name || "Unknown author"}</div>
              </article>
            ))
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

                <div className="mt-4 flex gap-3 text-sm">
                  <Link href="/profile" className="text-highlight-pit hover:opacity-80">
                    Profile
                  </Link>
                  <Link href="/wallet" className="text-muted-pit hover:opacity-100">
                    Wallet
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
                <h3 className="font-semibold mb-3">Favorites</h3>
                {favorites.length === 0 ? (
                  <p className="text-sm text-muted-pit">No favorites yet.</p>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((f) => (
                      <Link
                        key={f.favorite_user_id}
                        href={`/profile/${f.favorite_user_id}`}
                        className="block rounded-lg border border-white/5 px-3 py-2 text-sm"
                        style={{ background: "rgba(0,0,0,0.12)" }}
                      >
                        {f.display_name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="pit-panel p-5">
                <h3 className="font-semibold mb-3">Find users</h3>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-pit mb-1">
                    <span>Age range</span>
                    <span className="text-highlight-pit font-semibold">
                      {Math.min(finderMinAge, finderMaxAge)} – {Math.max(finderMinAge, finderMaxAge)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={13}
                    max={90}
                    value={finderMinAge}
                    onChange={(e) => onMinAge(Number(e.target.value))}
                    className="w-full mb-2"
                  />
                  <input
                    type="range"
                    min={13}
                    max={90}
                    value={finderMaxAge}
                    onChange={(e) => onMaxAge(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="text-xs text-muted-pit mb-2">Generation</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {GENERATIONS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleFinderGen(g.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs btn-metal ${
                        finderGens.includes(g.id) ? "ring-1 ring-[var(--pit-highlight)]" : ""
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setFinderFavoritesOnly((v) => !v)}
                  className={`w-full mb-3 px-3 py-2 rounded-xl text-sm font-medium transition btn-metal ${
                    finderFavoritesOnly ? "ring-1 ring-[var(--pit-highlight)]" : ""
                  }`}
                >
                  {finderFavoritesOnly ? "Favorites only · On" : "Favorites only · Off"}
                </button>

                <button
                  type="button"
                  onClick={handleFindUsers}
                  disabled={searching}
                  className="btn-write w-full px-3 py-2.5 rounded-xl text-sm disabled:opacity-60"
                >
                  {searching ? "Finding..." : "Find users"}
                </button>

                {searchMessage && <p className="text-xs text-yellow-500 mt-2">{searchMessage}</p>}

                <div className="space-y-2 mt-3">
                  {searchResults.map((u) => (
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
                          {[
                            u.generation,
                            u.age !== null ? `Age ${u.age}` : null,
                            u.location,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "No details"}
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
