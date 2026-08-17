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

export default function Home() {
  const [section, setSection] = useState<"All" | "Sports" | "Pop Culture" | "Satire">("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [points, setPoints] = useState(0);
  const [aiCredits, setAiCredits] = useState(0);
  const [upReceived, setUpReceived] = useState(0);
  const [downReceived, setDownReceived] = useState(0);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      setLoggedIn(Boolean(user));

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

        const { data: favRows } = await supabase
          .from("favorites")
          .select("favorite_user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const favList: Favorite[] = [];
        for (const row of favRows || []) {
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
      }

      setLoading(false);
    };
    load();
  }, []);

  const filteredArticles =
    section === "All" ? articles : articles.filter((a) => a.section === section);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
                  <Link href="/editor" className="text-gray-300 hover:text-white">
                    Write
                  </Link>
                </div>
              </div>

              <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Favorites</h3>
                {favorites.length === 0 ? (
                  <p className="text-sm text-gray-300">
                    No favorites yet. Open a profile and add people you want to track.
                  </p>
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

              <div className="bg-gradient-to-br from-orange-600/15 to-forge-900 border border-orange-500/20 rounded-2xl p-5 text-center">
                <p className="font-semibold mb-1">Got a take?</p>
                <p className="text-sm text-gray-300 mb-4">Jump in. Write it. Rank it.</p>
                <Link
                  href="/editor"
                  className="inline-block bg-forge-accent text-white font-medium px-6 py-2.5 rounded-xl transition text-sm mb-3"
                >
                  Write Article
                </Link>
                <div>
                  <Link
                    href="/fan-fiction"
                    className="inline-block text-sm text-purple-200 hover:text-purple-100 transition"
                  >
                    or Write Satire →
                  </Link>
                </div>
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
