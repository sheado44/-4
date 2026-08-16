"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Article = {
  id: string;
  title: string;
  section: string;
  body: string;
  created_at: string;
  user_id: string;
};

export default function ArticlePage() {
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, user_id")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Article not found.");
        setLoading(false);
        return;
      }

      setArticle(data);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-400">Loading article...</p>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-300 mb-4">{error || "Article not found."}</p>
        <Link href="/" className="text-forge-accent hover:text-orange-300 text-sm">
          ← Back home
        </Link>
      </main>
    );
  }

  const isSatire = article.section === "Satire";

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {isSatire && (
        <div className="sticky top-14 z-40 -mx-4 px-4 mb-6">
          <div className="bg-purple-600 text-white text-center text-sm font-semibold py-2 rounded-xl shadow-lg">
            Satire
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
        <span
          className={`px-2.5 py-1 rounded-md font-semibold ${
            isSatire
              ? "bg-purple-500/15 text-purple-300"
              : "bg-forge-accent/15 text-forge-accent"
          }`}
        >
          {article.section}
        </span>
        <span>{new Date(article.created_at).toLocaleDateString()}</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-8 tracking-tight">
        {article.title}
      </h1>

      <article className="max-w-none mb-12">
        {article.body.split("\n").filter(Boolean).map((paragraph, i) => (
          <p key={i} className="text-gray-300 leading-relaxed mb-5">
            {paragraph}
          </p>
        ))}
      </article>

      {isSatire && (
        <div className="mb-10 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 text-center">
          <p className="font-semibold text-purple-200 mb-1">Inspired?</p>
          <p className="text-sm text-gray-400 mb-4">Make your own satire piece.</p>
          <Link
            href="/fan-fiction"
            className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-2.5 rounded-xl transition text-sm"
          >
            Write Satire
          </Link>
        </div>
      )}

      {/* Comments section */}
      <section className="border-t border-forge-800 pt-8">
        <h3 className="text-xl font-bold mb-5">Comments</h3>

        <Link
          href={`/article/${article.id}/comment`}
          className="block bg-forge-900 border border-forge-800 hover:border-forge-accent/40 rounded-2xl p-4 mb-6 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium group-hover:text-forge-accent transition">
                Write a comment
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Images · GIFs · AI tools
              </div>
            </div>
            <div className="text-forge-accent text-sm font-medium">Open →</div>
          </div>
        </Link>

        <div className="bg-forge-900/50 border border-forge-800 rounded-xl p-6 text-center text-sm text-gray-500">
          No comments yet. Be the first.
        </div>
      </section>

      <div className="mt-10">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
