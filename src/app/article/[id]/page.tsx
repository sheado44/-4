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
  author_name: string | null;
};

type Comment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
  is_guest: boolean;
  user_id: string | null;
};

export default function ArticlePage() {
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadAll = async () => {
    if (!id) return;

    const { data: articleData, error: articleError } = await supabase
      .from("articles")
      .select("id, title, section, body, created_at, user_id, author_name")
      .eq("id", id)
      .single();

    if (articleError || !articleData) {
      setError("Article not found.");
      setLoading(false);
      return;
    }
    setArticle(articleData);

    const { data: commentData } = await supabase
      .from("comments")
      .select("id, author_name, body, created_at, is_guest, user_id")
      .eq("article_id", id)
      .order("created_at", { ascending: false });
    setComments(commentData || []);

    const { data: ratingData } = await supabase
      .from("ratings")
      .select("stars, user_id")
      .eq("article_id", id);

    if (ratingData && ratingData.length > 0) {
      const total = ratingData.reduce((sum, r) => sum + r.stars, 0);
      setAvgRating(total / ratingData.length);
      setRatingCount(ratingData.length);
    } else {
      setAvgRating(null);
      setRatingCount(0);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user) {
      setUserId(user.id);
      setUserName(
        user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "User"
      );
      const mine = ratingData?.find((r) => r.user_id === user.id);
      setMyRating(mine ? mine.stars : null);
    } else {
      setUserId(null);
      setUserName(null);
      setMyRating(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleComment = async () => {
    setMessage("");
    if (!userId || !userName) {
      setMessage("Log in to comment.");
      return;
    }
    if (!commentText.trim()) {
      setMessage("Write something first.");
      return;
    }

    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      article_id: id,
      user_id: userId,
      author_name: userName,
      body: commentText.trim(),
      is_guest: false,
    });

    if (error) {
      setMessage(`Comment failed: ${error.message}`);
    } else {
      setCommentText("");
      setMessage("Comment posted.");
      await loadAll();
    }
    setPosting(false);
  };

  const handleRating = async (stars: number) => {
    setMessage("");
    if (!userId) {
      setMessage("Log in to rate articles.");
      return;
    }

    if (myRating) {
      const { error } = await supabase
        .from("ratings")
        .update({ stars })
        .eq("article_id", id)
        .eq("user_id", userId);
      if (error) {
        setMessage(`Rating failed: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from("ratings").insert({
        article_id: id,
        user_id: userId,
        stars,
      });
      if (error) {
        setMessage(`Rating failed: ${error.message}`);
        return;
      }
    }

    setMyRating(stars);
    setMessage(`You rated this ${stars} star${stars === 1 ? "" : "s"}.`);
    await loadAll();
  };

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
  const author = article.author_name || "Unknown author";
  const initials = author
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
        {avgRating !== null && (
          <span className="text-yellow-500">
            ★ {avgRating.toFixed(1)} · {ratingCount} rating{ratingCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6 tracking-tight">
        {article.title}
      </h1>

      <Link
        href={`/profile/${article.user_id}`}
        className="flex items-center gap-3 mb-8 pb-6 border-b border-forge-800 group"
      >
        <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-bold">
          {initials}
        </div>
        <div>
          <div className="font-semibold group-hover:text-forge-accent transition">
            {author}
          </div>
          <div className="text-sm text-gray-400">Rank —</div>
        </div>
      </Link>

      <article className="max-w-none mb-10">
        {article.body.split("\n").filter(Boolean).map((paragraph, i) => (
          <p key={i} className="text-gray-300 leading-relaxed mb-5">
            {paragraph}
          </p>
        ))}
      </article>

      <div className="mb-10 p-5 bg-forge-900 border border-forge-800 rounded-2xl">
        <div className="text-sm text-gray-400 mb-2">Rate this article</div>
        <div className="flex items-center gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className={`transition hover:scale-110 ${
                (myRating ?? 0) >= star ? "text-yellow-500" : "text-gray-600"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {userId
            ? myRating
              ? `Your rating: ${myRating} star${myRating === 1 ? "" : "s"}`
              : "Click a star to rate"
            : "Log in to rate"}
        </p>
      </div>

      <section className="border-t border-forge-800 pt-8">
        <h3 className="text-xl font-bold mb-5">
          Comments ({comments.length})
        </h3>

        <div className="bg-forge-900 border border-forge-800 rounded-2xl p-4 mb-6">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={userId ? "Write a comment..." : "Log in to comment"}
            disabled={!userId}
            className="w-full min-h-[100px] bg-forge-950 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition disabled:opacity-60"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleComment}
              disabled={!userId || posting}
              className="px-5 py-2 bg-forge-accent hover:bg-forge-accentHover text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
            >
              {posting ? "Posting..." : "Post Comment"}
            </button>
            {!userId && (
              <Link href="/login" className="text-sm text-gray-400 hover:text-white">
                Log in
              </Link>
            )}
          </div>
        </div>

        {message && <p className="text-sm text-yellow-300 mb-4">{message}</p>}

        {comments.length === 0 ? (
          <div className="bg-forge-900/50 border border-forge-800 rounded-xl p-6 text-center text-sm text-gray-500">
            No comments yet. Be the first.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-forge-900 border border-forge-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm mb-2">
                  {c.user_id ? (
                    <Link
                      href={`/profile/${c.user_id}`}
                      className="font-medium hover:text-forge-accent transition"
                    >
                      {c.author_name}
                    </Link>
                  ) : (
                    <span className="font-medium">{c.author_name}</span>
                  )}
                  <span className="text-gray-500 text-xs">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-10">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
