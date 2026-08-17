"use client";

import { useEffect, useState } from "react";
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
};

export default function Home() {
  const [section, setSection] = useState<"All" | "Sports" | "Pop Culture" | "Satire">("All");
  const [articles, setArticles] = useState<Article[]>([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);

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
      if (!error && data) setArticles(data);

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

  const handleSearchUsers = async () => {
    setSearchMessage("");
    setSearchResults([]);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchMessage("Type at least 2 characters.");
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name")
      .ilike("display_name", `%${q}%`)
      .limit(8);

    if (error) {
      setSearchMessage(error.message);
      setSearching(false);
      return;
    }

    setSearchResults(
      (data || [])
        .filter((u) => u.id !== userId)
        .map((u) => ({
          id: u.id,
          display_name: u.display_name || "User",
        }))
    );
    if ((data || []).length === 0) setSearchMessage("No users found.");
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

  const filteredArticles =
    section === "All" ? articles : articles.filter((a) => a.section === section);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const writeSection = section === "All" ? "Sports" : section;

  return (
    <main className="min-h-screen">
      <section className="pt-8 pb-6 text-center px-4">
        <div className="flex justify-center mb-3">
          <img
            src="/ballpit-logo.png"
            alt="The Ballpit"
            className="w-full max-w-3xl md:max-w-4xl h-auto mix-blend-multiply brightness-110 contrast-125"
          />
        </div>
        <p className="text-gray-200 text-sm tracking-[0.25em] uppercase mb-1">
          Sports & Pop Culture
        </p>
        <p className="text-forge-accent text-lg md:text-xl font-semibold tracking-wide">
          Jump in.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2 mb-5 justify-center md:justify-start">
          {(["All", "Sports", "Pop Culture", "Satire"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setSection(item)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                section === item
                  ? "bg-forge-accent text-white font-semibold"
                  : "bg-forge-800 hover:bg-forge-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-forge-900/60 border border-forge-800 rounded-2xl p-8 text-center text-gray-300 text-sm">
              Loading articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-forge-900/60 border border-forge-800 rounded-2xl p-8 text-center text-gray-300 text-sm">
              No articles in this section yet.
            </div>
          ) : (
            filteredArticles.map((article) => (
              <article
                key={article.id}
                className="group bg-forge-900/60 border border-forge-800 hover:border-forge-accent/40 rounded-2xl p-5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                  <span className="bg-forge-accent/15 text-forge-accent px-2 py-0.5 rounded-md font-semibold">
                    {article.section}
                  </span>
                  <span>{formatTime(article.created_at)}</span>
                </div>

                <Link href={`/article/${article.id}`}>
                  <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-forge-accent transition leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-gray-300 text-sm line-clamp-3 mb-3 leading-relaxed">
                    {article.body}
                  </p>
                </Link>

                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-white font-medium">
                    {article.author_name || "Unknown author"}
                  </span>
                </div>
              </article>
            ))
          )}

          {loggedIn && (
            <div className="pt-4">
              <Link
                href={`/editor?section=${encodeURIComponent(writeSection)}`}
                className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 rounded-xl bg-forge-accent text-white text-sm font-medium"
              >
                {section === "All" ? "Write an article" : `Write in ${section}`}
              </Link>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          {loggedIn ? (
            <>
              <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover border border-forge-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                      {initials}
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">Your desk</div>
                    <div className="text-xl font-bold">{displayName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-gray-300 text-xs">Points</div>
                    <div className="text-lg font-semibold text-forge-accent">{points}</div>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-gray-300 text-xs">AI Credits</div>
                    <div className="text-lg font-semibold">{aiCredits}</div>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-gray-300 text-xs">Upvotes</div>
                    <div className="text-lg font-semibold text-green-300">{upReceived}</div>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <div className="text-gray-300 text-xs">Downvotes</div>
                    <div className="text-lg font-semibold text-red-300">{downReceived}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3 text-sm">
                  <Link href="/profile" className="text-forge-accent hover:text-orange-300">
                    Profile
                  </Link>
                  <Link href="/wallet" className="text-gray-300 hover:text-white">
                    Wallet
                  </Link>
                </div>
              </div>

              <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Search users</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by display name..."
                    className="flex-1 bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={handleSearchUsers}
                    disabled={searching}
                    className="px-3 py-2 rounded-xl bg-forge-accent text-white text-sm disabled:opacity-60"
                  >
                    {searching ? "..." : "Search"}
                  </button>
                </div>

                {searchMessage && (
                  <p className="text-xs text-yellow-200 mb-2">{searchMessage}</p>
                )}

                <div className="space-y-2">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-2"
                    >
                      <Link href={`/profile/${u.id}`} className="text-sm hover:text-forge-accent">
                        {u.display_name}
                      </Link>
                      <button
                        onClick={() => addFavorite(u.id, u.display_name)}
                        className="text-xs px-2 py-1 rounded-lg bg-forge-accent text-white"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Watchlist activity</h3>
                {watchFeed.length === 0 ? (
                  <p className="text-sm text-gray-300">
                    No watchlist activity yet. Search and favorite people to track them.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {watchFeed.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block rounded-xl bg-black/20 px-3 py-2 hover:bg-black/30 transition"
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {item.kind === "article"
                            ? "Article"
                            : item.kind === "reply"
                            ? "Reply"
                            : "Comment"}{" "}
                          · {formatTime(item.created_at)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-white">{item.actor_name}</span>{" "}
                          <span className="text-gray-300">{item.summary}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Favorites</h3>
                {favorites.length === 0 ? (
                  <p className="text-sm text-gray-300">No favorites yet.</p>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((f) => (
                      <Link
                        key={f.favorite_user_id}
                        href={`/profile/${f.favorite_user_id}`}
                        className="block rounded-lg bg-black/20 px-3 py-2 text-sm hover:bg-black/30 transition"
                      >
                        {f.display_name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 text-center">
              <p className="font-semibold mb-1">Want to publish?</p>
              <p className="text-sm text-gray-300 mb-4">
                Create an account to write articles and use AI tools.
              </p>
              <Link
                href="/login"
                className="inline-block bg-forge-accent text-white font-medium px-6 py-2.5 rounded-xl transition text-sm"
              >
                Log in / Sign up
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
