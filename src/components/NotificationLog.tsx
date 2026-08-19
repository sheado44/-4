"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formatTime } from "@/lib/time";
import TbpIndex, { computeTbpBreakdown } from "@/components/TbpIndex";
import { AlertsDeskWidget } from "@/components/NotificationLog";
import { DEFAULT_WIDGETS, loadWidgetLayout, type WidgetId } from "@/lib/widgetLayout";

type Article = {
  id: string;
  title: string;
  section: string;
  body: string;
  created_at: string;
  user_id: string;
  author_name: string | null;
  ai_score: number | null;
  status?: string | null;
  thumbnail_url?: string | null;
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

type LeagueId = "NFL" | "NBA" | "MLB" | "NHL" | "CFB" | "CBB" | "Golf";

type ScoreItem = {
  id: string;
  league: LeagueId;
  status: "Live" | "Final" | "Upcoming";
  scoreLine: string;
  headline: string;
};

type StandingRow = {
  rank: number;
  team: string;
  record: string;
};

type TrendTopic = {
  id: string;
  label: string;
  keywords: string[];
};

const ALL_LEAGUES: LeagueId[] = ["NFL", "NBA", "MLB", "NHL", "CFB", "CBB", "Golf"];
const DEFAULT_LEAGUES: LeagueId[] = ["NFL", "CFB", "NBA"];
const SCORES_STORAGE_KEY = "ballpit-desk-leagues";

const STUB_SCORES: ScoreItem[] = [
  {
    id: "1",
    league: "NFL",
    status: "Final",
    scoreLine: "KC 24 · BUF 20",
    headline: "Chiefs edge Bills in a late-drive finish",
  },
  {
    id: "2",
    league: "NFL",
    status: "Live",
    scoreLine: "PHI 17 · DAL 14",
    headline: "Eagles lead as fourth quarter opens",
  },
  {
    id: "3",
    league: "CFB",
    status: "Final",
    scoreLine: "UGA 31 · ALA 24",
    headline: "Bulldogs hold off Tide in night-game thriller",
  },
  {
    id: "4",
    league: "CFB",
    status: "Upcoming",
    scoreLine: "OSU vs MICH · 7:30 PM",
    headline: "Rivalry week: Buckeyes and Wolverines set for primetime",
  },
  {
    id: "5",
    league: "NBA",
    status: "Final",
    scoreLine: "BOS 112 · NYK 105",
    headline: "Celtics close out Knicks with fourth-quarter surge",
  },
  {
    id: "6",
    league: "NBA",
    status: "Live",
    scoreLine: "DEN 88 · MIN 84",
    headline: "Nuggets cling to a slim lead late",
  },
  {
    id: "7",
    league: "MLB",
    status: "Final",
    scoreLine: "NYY 5 · BOS 3",
    headline: "Yankees take the rubber match at Fenway",
  },
  {
    id: "8",
    league: "NHL",
    status: "Final",
    scoreLine: "TOR 4 · MTL 2",
    headline: "Leafs pull away after a messy second period",
  },
  {
    id: "9",
    league: "CBB",
    status: "Upcoming",
    scoreLine: "UConn vs PUR · 8:00 PM",
    headline: "Title contenders meet in a top-10 showdown",
  },
  {
    id: "10",
    league: "Golf",
    status: "Live",
    scoreLine: "Round 3 · -12 lead",
    headline: "Leaderboard tightens as contenders make the turn",
  },
];

const STUB_STANDINGS: Record<LeagueId, StandingRow[]> = {
  NFL: [
    { rank: 1, team: "Kansas City", record: "11-3" },
    { rank: 2, team: "Buffalo", record: "10-4" },
    { rank: 3, team: "Baltimore", record: "10-4" },
    { rank: 4, team: "Detroit", record: "9-5" },
    { rank: 5, team: "Philadelphia", record: "9-5" },
  ],
  NBA: [
    { rank: 1, team: "Boston", record: "42-12" },
    { rank: 2, team: "OKC", record: "40-14" },
    { rank: 3, team: "Denver", record: "38-16" },
    { rank: 4, team: "Minnesota", record: "36-18" },
    { rank: 5, team: "New York", record: "35-19" },
  ],
  MLB: [
    { rank: 1, team: "Yankees", record: "78-48" },
    { rank: 2, team: "Orioles", record: "75-51" },
    { rank: 3, team: "Guardians", record: "72-54" },
    { rank: 4, team: "Astros", record: "71-55" },
    { rank: 5, team: "Dodgers", record: "70-56" },
  ],
  NHL: [
    { rank: 1, team: "Panthers", record: "38-14-5" },
    { rank: 2, team: "Canucks", record: "36-16-6" },
    { rank: 3, team: "Hurricanes", record: "35-17-5" },
    { rank: 4, team: "Bruins", record: "34-18-6" },
    { rank: 5, team: "Oilers", record: "33-19-6" },
  ],
  CFB: [
    { rank: 1, team: "Georgia", record: "11-1" },
    { rank: 2, team: "Ohio State", record: "11-1" },
    { rank: 3, team: "Texas", record: "10-2" },
    { rank: 4, team: "Oregon", record: "10-2" },
    { rank: 5, team: "Alabama", record: "10-2" },
  ],
  CBB: [
    { rank: 1, team: "UConn", record: "22-2" },
    { rank: 2, team: "Purdue", record: "21-3" },
    { rank: 3, team: "Houston", record: "20-4" },
    { rank: 4, team: "Arizona", record: "20-4" },
    { rank: 5, team: "Tennessee", record: "19-5" },
  ],
  Golf: [
    { rank: 1, team: "Player A", record: "-12" },
    { rank: 2, team: "Player B", record: "-10" },
    { rank: 3, team: "Player C", record: "-9" },
    { rank: 4, team: "Player D", record: "-8" },
    { rank: 5, team: "Player E", record: "-7" },
  ],
};

const TREND_TOPICS: TrendTopic[] = [
  {
    id: "t1",
    label: "NFL quarterback market",
    keywords: ["quarterback", "qb", "nfl", "trade", "starter"],
  },
  {
    id: "t2",
    label: "College football playoff",
    keywords: ["playoff", "cfb", "college football", "sec", "big ten"],
  },
  {
    id: "t3",
    label: "NBA finals race",
    keywords: ["nba", "finals", "playoffs", "championship"],
  },
  {
    id: "t4",
    label: "Hollywood awards season",
    keywords: ["oscar", "awards", "film", "movie", "actress"],
  },
  {
    id: "t5",
    label: "Streaming TV hits",
    keywords: ["netflix", "streaming", "series", "tv", "episode"],
  },
  {
    id: "t6",
    label: "Golf major week",
    keywords: ["golf", "masters", "pga", "major"],
  },
];

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

function articleMatchesTopic(article: Article, topic: TrendTopic) {
  const text = `${article.title} ${article.body}`.toLowerCase();
  return topic.keywords.some((k) => text.includes(k.toLowerCase()));
}

function isPublicArticle(article: Article) {
  // Missing status = older rows → still public
  return !article.status || article.status === "published";
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

function ScoresDeskWidget({
  selectedLeagues,
  setSelectedLeagues,
}: {
  selectedLeagues: LeagueId[];
  setSelectedLeagues: (leagues: LeagueId[]) => void;
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [mode, setMode] = useState<"scores" | "standings">("scores");

  const activeLeagues = selectedLeagues.length ? selectedLeagues : DEFAULT_LEAGUES;
  const safeIndex = Math.min(carouselIndex, Math.max(activeLeagues.length - 1, 0));
  const currentLeague = activeLeagues[safeIndex] || DEFAULT_LEAGUES[0];
  const leagueScores = STUB_SCORES.filter((s) => s.league === currentLeague);
  const leagueStandings = STUB_STANDINGS[currentLeague] || [];

  useEffect(() => {
    if (carouselIndex > activeLeagues.length - 1) setCarouselIndex(0);
  }, [activeLeagues.length, carouselIndex]);

  const toggleLeague = (league: LeagueId) => {
    if (selectedLeagues.includes(league)) {
      if (selectedLeagues.length === 1) return;
      const next = selectedLeagues.filter((l) => l !== league);
      setSelectedLeagues(next);
      try {
        localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    } else {
      const next = [...selectedLeagues, league];
      setSelectedLeagues(next);
      try {
        localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }
  };

  return (
    <div className="pit-panel p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold">Scores & Standings</h3>
        <button
          type="button"
          onClick={() => setEditOpen((v) => !v)}
          className="text-xs text-muted-pit hover:opacity-100"
        >
          {editOpen ? "Done" : "Leagues"}
        </button>
      </div>

      {editOpen && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ALL_LEAGUES.map((league) => {
            const on = selectedLeagues.includes(league);
            return (
              <button
                key={league}
                type="button"
                onClick={() => toggleLeague(league)}
                className="px-2.5 py-1 rounded-lg text-xs border"
                style={{
                  borderColor: on
                    ? "color-mix(in srgb, var(--pit-highlight) 60%, transparent)"
                    : "rgba(255,255,255,0.12)",
                  background: on
                    ? "color-mix(in srgb, var(--pit-highlight) 18%, transparent)"
                    : "rgba(255,255,255,0.04)",
                  color: "var(--pit-text)",
                }}
              >
                {league}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode("scores")}
          className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${
            mode === "scores" ? "btn-write border-transparent" : "btn-metal"
          }`}
        >
          Scores
        </button>
        <button
          type="button"
          onClick={() => setMode("standings")}
          className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${
            mode === "standings" ? "btn-write border-transparent" : "btn-metal"
          }`}
        >
          Standings
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-lg btn-metal"
          onClick={() =>
            setCarouselIndex((i) => (i - 1 + activeLeagues.length) % activeLeagues.length)
          }
        >
          ‹
        </button>
        <div className="text-sm font-semibold tracking-wide" style={{ color: "var(--pit-text)" }}>
          {currentLeague}
        </div>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-lg btn-metal"
          onClick={() => setCarouselIndex((i) => (i + 1) % activeLeagues.length)}
        >
          ›
        </button>
      </div>

      <div className="flex justify-center gap-1 mb-3">
        {activeLeagues.map((league, i) => (
          <button
            key={league}
            type="button"
            onClick={() => setCarouselIndex(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === safeIndex ? 16 : 6,
              background: i === safeIndex ? "var(--pit-highlight)" : "rgba(255,255,255,0.2)",
            }}
            aria-label={league}
          />
        ))}
      </div>

      {mode === "scores" ? (
        <div className="space-y-2">
          {leagueScores.length === 0 ? (
            <p className="text-sm text-muted-pit">No games in this league right now.</p>
          ) : (
            leagueScores.map((game) => (
              <div
                key={game.id}
                className="rounded-xl border border-white/5 px-3 py-2"
                style={{ background: "rgba(0,0,0,0.12)" }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: "var(--pit-text)" }}>
                    {game.scoreLine}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        game.status === "Live" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                      color: game.status === "Live" ? "#fca5a5" : "var(--pit-muted)",
                    }}
                  >
                    {game.status}
                  </span>
                </div>
                <p className="text-xs text-muted-pit leading-snug">{game.headline}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {leagueStandings.length === 0 ? (
            <p className="text-sm text-muted-pit">No standings available.</p>
          ) : (
            leagueStandings.map((row) => (
              <div
                key={`${currentLeague}-${row.rank}-${row.team}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/5 px-3 py-1.5"
                style={{ background: "rgba(0,0,0,0.12)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-pit w-4">{row.rank}</span>
                  <span className="text-sm font-medium truncate" style={{ color: "var(--pit-text)" }}>
                    {row.team}
                  </span>
                </div>
                <span className="text-xs font-semibold text-highlight-pit shrink-0">{row.record}</span>
              </div>
            ))
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-pit mt-3">
        Sample scores & standings for layout. Live data comes when a sports provider is connected.
      </p>
    </div>
  );
}

function TrendingIrlWidget({ articles }: { articles: Article[] }) {
  const rows = useMemo(() => {
    return TREND_TOPICS.map((topic) => {
      const matches = articles
        .filter(isPublicArticle)
        .filter((a) => a.section !== "Satire")
        .filter((a) => articleMatchesTopic(a, topic))
        .slice(0, 3);
      return { topic, matches };
    });
  }, [articles]);

  return (
    <div className="pit-panel p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold">Trending IRL</h3>
        <span className="text-[10px] uppercase tracking-wide text-muted-pit">News trends</span>
      </div>

      <div className="space-y-3">
        {rows.map(({ topic, matches }) => (
          <div
            key={topic.id}
            className="rounded-xl border border-white/5 px-3 py-2.5"
            style={{ background: "rgba(0,0,0,0.12)" }}
          >
            <div className="text-sm font-semibold mb-1.5" style={{ color: "var(--pit-text)" }}>
              {topic.label}
            </div>

            {matches.length === 0 ? (
              <div className="text-xs text-muted-pit">
                No theBallpit takes yet.{" "}
                <Link href="/editor" className="text-highlight-pit hover:opacity-80">
                  Write one
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {matches.map((a) => (
                  <Link
                    key={a.id}
                    href={`/article/${a.id}`}
                    className="block text-xs hover:opacity-90"
                  >
                    <span className="text-highlight-pit font-medium line-clamp-1">{a.title}</span>
                    <span className="text-muted-pit"> · {a.author_name || "Unknown"}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-pit mt-3">
        Topics are news/trends-style samples. Live RSS/news trend feeds can replace this list
        later; matching already uses your theBallpit article database.
      </p>
    </div>
  );
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<"All" | "Sports" | "Pop Culture" | "Satire">("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [statsById, setStatsById] = useState<Record<string, ArticleStats>>({});
  const [authorRatings, setAuthorRatings] = useState<Record<string, AuthorRating>>({});
  const [authorGens, setAuthorGens] = useState<Record<string, Generation | null>>({});
  const [authorAvatars, setAuthorAvatars] = useState<Record<string, string>>({});
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
  const [minTbp, setMinTbp] = useState(0);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const [selectedLeagues, setSelectedLeagues] = useState<LeagueId[]>(DEFAULT_LEAGUES);

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [widgetOn, setWidgetOn] = useState<Record<WidgetId, boolean>>(
    Object.fromEntries(DEFAULT_WIDGETS.map((id) => [id, true])) as Record<WidgetId, boolean>
  );

  useEffect(() => {
    const apply = () => {
      const layout = loadWidgetLayout();
      setWidgetOrder(layout.order);
      setWidgetOn(layout.on);
    };
    apply();
    window.addEventListener("ballpit-layout-updated", apply);
    return () => window.removeEventListener("ballpit-layout-updated", apply);
  }, []);

  const widgetPos = (id: WidgetId) => {
    const visible = widgetOrder.filter((w) => widgetOn[w]);
    const i = visible.indexOf(id);
    return i < 0 ? 99 : i;
  };

  useEffect(() => {
    const s = searchParams.get("section");
    if (s === "Sports" || s === "Pop Culture" || s === "Satire") setSection(s);
    else setSection("All");
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCORES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LeagueId[];
        if (Array.isArray(parsed) && parsed.length) setSelectedLeagues(parsed);
      }
    } catch {}
  }, []);

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
        avg: authorSums[uid].count ? authorSums[uid].total / authorSums[uid].count : null,
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
        .select("id, title, author_name, created_at, user_id, status")
        .in("user_id", favIds)
        .order("created_at", { ascending: false })
        .limit(20);

      (favArticles || [])
        .filter((a: any) => !a.status || a.status === "published")
        .forEach((a) => {
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

      feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
        .select("id, title, section, body, created_at, user_id, author_name, ai_score, status, thumbnail_url")
        .order("created_at", { ascending: false });

      let mapped: Article[] = [];

      if (error) {
        const { data: fallback } = await supabase
          .from("articles")
          .select("id, title, section, body, created_at, user_id, author_name")
          .order("created_at", { ascending: false });
        mapped = (fallback || []).map((a: any) => ({
          ...a,
          ai_score: null,
          status: "published",
          thumbnail_url: a.thumbnail_url || null,
        }));
      } else {
        mapped = (data || []).map((a: any) => ({
          ...a,
          ai_score: a.ai_score == null ? null : Number(a.ai_score),
          status: a.status || "published",
          thumbnail_url: a.thumbnail_url || null,
        }));
      }

      setArticles(mapped);
      await loadArticleStats(mapped.filter(isPublicArticle));

      const ids = Array.from(new Set(mapped.map((a) => a.user_id).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, birthday, avatar_url")
          .in("id", ids);
        const genMap: Record<string, Generation | null> = {};
        const avatarMap: Record<string, string> = {};
        (profiles || []).forEach((p) => {
          genMap[p.id] = generationFromBirthday(p.birthday);
          if (p.avatar_url) avatarMap[p.id] = p.avatar_url;
        });
        ids.forEach((id) => {
          if (!(id in genMap)) genMap[id] = null;
        });
        setAuthorGens(genMap);
        setAuthorAvatars(avatarMap);
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
        .select("id, title, section, body, created_at, user_id, author_name, ai_score, status, thumbnail_url")
        .or(`title.ilike.%${topicQ}%,body.ilike.%${topicQ}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        const { data: fallback } = await supabase
          .from("articles")
          .select("id, title, section, body, created_at, user_id, author_name")
          .or(`title.ilike.%${topicQ}%,body.ilike.%${topicQ}%`)
          .order("created_at", { ascending: false })
          .limit(30);
        setTopicArticles(
          (fallback || [])
            .map((a: any) => ({ ...a, ai_score: null, status: "published", thumbnail_url: a.thumbnail_url || null }))
            .filter(isPublicArticle)
            .slice(0, 20)
        );
      } else {
        setTopicArticles(
          (data || [])
            .map((a: any) => ({
              ...a,
              ai_score: a.ai_score == null ? null : Number(a.ai_score),
              status: a.status || "published",
            }))
            .filter(isPublicArticle)
            .slice(0, 20)
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
    if (minTbp > 0) n += 1;
    return n;
  }, [onlyFavorites, feedGens, minTbp]);

  const filteredArticles = useMemo(() => {
    // Public feeds never show author_only
    let list = articles.filter(isPublicArticle);

    if (section === "All") {
      list = list.filter((a) => a.section !== "Satire");
    } else {
      list = list.filter((a) => a.section === section);
    }

    if (loggedIn && onlyFavorites) {
      list = list.filter((a) => favoriteIds.has(a.user_id));
    }

    if (loggedIn && feedGens.length > 0) {
      list = list.filter((a) => {
        const gen = authorGens[a.user_id];
        return gen !== null && feedGens.includes(gen);
      });
    }

    if (minTbp > 0) {
      list = list.filter((a) => {
        const stats = statsById[a.id];
        const b = computeTbpBreakdown(a.ai_score, a.body, stats?.avgRating ?? null);
        return (b.index100 ?? 0) >= minTbp;
      });
    }

    return list;
  }, [articles, section, loggedIn, onlyFavorites, favoriteIds, feedGens, authorGens, minTbp, statsById]);

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
    setMinTbp(0);
  };

  const feedFiltering = feedGens.length > 0;

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-2">
          <div className="metal-card overflow-hidden">
            <img
              src="/ballpit-hero.png"
              alt="theBallpit"
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
              onClick={() => {
                setSection(item);
                router.push(item === "All" ? "/" : `/?section=${encodeURIComponent(item)}`);
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition border ${
                section === item ? "btn-write border-transparent" : "btn-metal"
              }`}
            >
              {item}
            </button>
          ))}

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


                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-muted-pit">Min tBp Index</div>
                      <div className="text-xs font-semibold">{minTbp > 0 ? minTbp : "Any"}</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={minTbp}
                      onChange={(e) => setMinTbp(Number(e.target.value))}
                      className="w-full accent-[var(--pit-highlight)]"
                    />
                    <p className="text-[11px] text-muted-pit mt-1">
                      Hide pieces below this score (1–100). 0 shows everything.
                    </p>
                  </div>
                  {loggedIn && (
                  <label className="flex items-center justify-between gap-3 mb-4 text-sm cursor-pointer">
                    <span>Only favorites</span>
                    <input
                      type="checkbox"
                      checked={onlyFavorites}
                      onChange={(e) => setOnlyFavorites(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                  )}

                  {loggedIn && (
                  <>
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
                  </>
                  )}

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
        </div>
      </div>

      {section === "Satire" && (
        <div
          className="sticky top-0 z-30 border-y"
          style={{
            background: "color-mix(in srgb, #7a1f1f 55%, #1E2022 45%)",
            borderColor: "rgba(255,180,120,0.35)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="text-sm font-bold tracking-wide mb-1" style={{ color: "#FFE6C7" }}>
              SATIRE
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,230,199,0.92)" }}>
              This section contains satirical, exaggerated, and fictional content created for
              entertainment. It is not news reporting. Names, events, and statements may be invented
              or distorted on purpose. Do not treat anything here as fact. By viewing this section
              you acknowledge it is labeled satire and is separate from Sports and Pop Culture
              journalism on theBallpit. Additional terms may apply in the site Terms of Service.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pt-2">
        <div className="lg:col-span-2 space-y-4 min-w-0 order-1">
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
              const authorRate = authorRatings[article.user_id];
              const gen = authorGens[article.user_id];

              return (
                <article key={article.id} className="metal-card p-5 transition-all duration-200">
                  <div className="flex gap-4 mb-4">
                    <Link
                      href={`/article/${article.id}`}
                      className="shrink-0 w-28 h-20 md:w-36 md:h-24 rounded-xl overflow-hidden border border-white/10"
                      style={{ background: "rgba(0,0,0,0.28)" }}
                    >
                      {article.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] uppercase tracking-[0.14em] text-muted-pit text-center px-1">
                          Thumb
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-pit mb-2">
                    <span className="bg-highlight-soft px-2 py-0.5 rounded-md font-semibold">
                      {article.section}
                    </span>
                    <span>{formatTime(article.created_at)}</span>
                  </div>

                  <Link href={`/article/${article.id}`}>
                    <h2 className="text-lg md:text-xl font-bold mb-2 hover:opacity-90 transition leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-muted-pit text-sm line-clamp-3 leading-relaxed">
                      {article.body}
                    </p>
                  </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <TbpIndex
                      aiScore={article.ai_score}
                      body={article.body}
                      avgRating={stats.avgRating}
                      ratingCount={stats.ratingCount}
                    />

                    <Link
                      href={`/article/${article.id}#comments`}
                      className="rounded-xl px-3 py-2.5 border border-white/10 hover:opacity-90 transition"
                      style={{ background: "rgba(0,0,0,0.18)" }}
                    >
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit font-semibold mb-0.5">
                        Comments
                      </div>
                      <div className="text-2xl font-bold leading-none" style={{ color: "var(--pit-text)" }}>
                        {stats.commentCount}
                      </div>
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {authorAvatars[article.user_id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authorAvatars[article.user_id]}
                        alt={article.author_name || "Author"}
                        className="w-6 h-6 rounded-full object-cover border border-white/10 bg-black/20"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10" />
                    )}
                    {article.user_id ? (
                      <Link
                        href={`/profile/${article.user_id}`}
                        className="font-medium hover:opacity-80 text-highlight-pit"
                      >
                        {article.author_name || "Unknown author"}
                      </Link>
                    ) : (
                      <span className="font-medium">{article.author_name || "Unknown author"}</span>
                    )}

                    {gen && (
                      <span className="text-xs px-2 py-0.5 rounded-md border border-white/10 text-muted-pit">
                        {gen}
                      </span>
                    )}

                    <span className="text-xs text-muted-pit" title="Author average rating">
                      Author ★{" "}
                      <span className="font-semibold" style={{ color: "var(--pit-text)" }}>
                        {authorRate?.avg != null ? authorRate.avg.toFixed(1) : "—"}
                      </span>
                      {authorRate?.count ? <span className="ml-1">({authorRate.count})</span> : null}
                    </span>
                  </div>
                </article>
              );
            })
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-2">
            {loggedIn && (
              <Link
                href={writeHref}
                className="btn-write inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 rounded-xl text-sm"
              >
                {writeLabel}
              </Link>
            )}
            <Link
              href="/moshpit"
              className="btn-metal inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 rounded-xl text-sm"
            >
              theMoshpit
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:gap-5 min-w-0 order-2 lg:sticky lg:top-20 lg:self-start">
          {loggedIn ? (
            <>
              {widgetOn.desk && (
              <div className="pit-panel p-5" style={{ order: widgetPos("desk") }}>
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

              )}
              {widgetOn.alerts && userId && (
                <div style={{ order: widgetPos("alerts") }}>
                  <AlertsDeskWidget userId={userId} />
                </div>
              )}
              {widgetOn.scores && (
              <div style={{ order: widgetPos("scores") }}>
              <ScoresDeskWidget
                selectedLeagues={selectedLeagues}
                setSelectedLeagues={setSelectedLeagues}
              />
              </div>

              )}
              {widgetOn.trending && (
              <div style={{ order: widgetPos("trending") }}>
              <TrendingIrlWidget articles={articles} />
              </div>

              )}
              {widgetOn.watch && (
              <div className="pit-panel p-5" style={{ order: widgetPos("watch") }}>
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

              )}
              {widgetOn.find && (
              <div className="pit-panel p-5" style={{ order: widgetPos("find") }}>
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
              )}
              {widgetOn.moshpit && (
                <div className="pit-panel p-5" style={{ order: widgetPos("moshpit") }}>
                  <h3 className="font-semibold mb-2">theMoshpit</h3>
                  <p className="text-sm text-muted-pit mb-3">
                    Trash talk and chat with no article attached.
                  </p>
                  <Link href="/moshpit" className="btn-write inline-block px-4 py-2 rounded-xl text-sm">
                    Jump in
                  </Link>
                </div>
              )}
              {widgetOn.rules && (
                <div className="pit-panel p-5" style={{ order: widgetPos("rules") }}>
                  <h3 className="font-semibold mb-2">House rules</h3>
                  <p className="text-sm text-muted-pit mb-3">
                    theBallpit is a rough room. Insults are allowed. Exploitation, doxxing,
                    threats, spam, and impersonation are removed.
                  </p>
                  <Link href="/rules" className="text-sm text-highlight-pit">
                    Read the list →
                  </Link>
                </div>
              )}
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

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-muted-pit">
            Loading theBallpit...
          </div>
        </main>
      }
    >
      <Home />
    </Suspense>
  );
}
