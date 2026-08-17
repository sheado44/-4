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

export default function Home() {
  const [section, setSection] = useState<"All" | "Sports" | "Pop Culture" | "Satire">("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      setLoggedIn(Boolean(auth.user));

      const { data, error } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, user_id, author_name")
        .order("created_at", { ascending: false });

      if (!error && data) setArticles(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredArticles =
    section === "All" ? articles : articles.filter((a) => a.section === section);

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
                <Link href="/fan-fiction" className="inline-block text-sm text-purple-200 hover:text-purple-100 transition">
                  or Write Satire →
                </Link>
              </div>
            </div>
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
