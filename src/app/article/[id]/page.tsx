"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formatTime, formatTimeFull } from "@/lib/time";

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

type Voter = {
  user_id: string;
  name: string;
};

type VoteInfo = {
  up: number;
  down: number;
  myVote: number | null;
  upVoters: Voter[];
  downVoters: Voter[];
};

type VoteMap = Record<string, VoteInfo>;

function makeGuestName() {
  const rand = Math.random().toString(16).slice(2, 8);
  return `anon_${rand}`;
}

export default function ArticlePage() {
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
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
    const loadedComments = commentData || [];
    setComments(loadedComments);

    const commentIds = loadedComments.map((c) => c.id);
    const voteMap: VoteMap = {};
    commentIds.forEach((cid) => {
      voteMap[cid] = { up: 0, down: 0, myVote: null, upVoters: [], downVoters: [] };
    });

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user || null;
    const currentUserId = currentUser?.id || null;

    if (commentIds.length > 0) {
      const { data: voteData } = await supabase
        .from("comment_votes")
        .select("comment_id, user_id, vote")
        .in("comment_id", commentIds);

      const voterIds = Array.from(
        new Set((voteData || []).map((v) => v.user_id).filter(Boolean))
      );

      const nameById: Record<string, string> = {};
      if (voterIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", voterIds);

        (profiles || []).forEach((p) => {
          nameById[p.id] = p.display_name || "User";
        });
      }

      (voteData || []).forEach((v) => {
        if (!voteMap[v.comment_id]) {
          voteMap[v.comment_id] = {
            up: 0,
            down: 0,
            myVote: null,
            upVoters: [],
            downVoters: [],
          };
        }

        const voter = {
          user_id: v.user_id,
          name: nameById[v.user_id] || "User",
        };

        if (v.vote === 1) {
          voteMap[v.comment_id].up += 1;
          voteMap[v.comment_id].upVoters.push(voter);
        }
        if (v.vote === -1) {
          voteMap[v.comment_id].down += 1;
          voteMap[v.comment_id].downVoters.push(voter);
        }
        if (currentUserId && v.user_id === currentUserId) {
          voteMap[v.comment_id].myVote = v.vote;
        }
      });
    }
    setVotes(voteMap);

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

    if (currentUser) {
      setUserId(currentUser.id);
      setUserName(
        currentUser.user_metadata?.display_name ||
          currentUser.email?.split("@")[0] ||
          "User"
      );
      const mine = ratingData?.find((r) => r.user_id === currentUser.id);
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
    if (!commentText.trim()) {
      setMessage("Write something first.");
      return;
    }

    setPosting(true);
    const isLoggedIn = Boolean(userId && userName);
    const authorName = isLoggedIn ? userName! : makeGuestName();

    const { error } = await supabase.from("comments").insert({
      article_id: id,
      user_id: isLoggedIn ? userId : null,
      author_name: authorName,
      body: commentText.trim(),
      is_guest: !isLoggedIn,
    });

    if (error) {
      setMessage(`Comment failed: ${error.message}`);
    } else {
      setCommentText("");
      setMessage(
        isLoggedIn
          ? "Comment posted."
          : `Guest comment posted as ${authorName}.`
      );
      await loadAll();
    }
    setPosting(false);
  };

  const handleCommentVote = async (commentId: string, nextVote: 1 | -1) => {
    setMessage("");
    if (!userId) {
      setMessage("Log in to vote on comments.");
      return;
    }

    const current = votes[commentId]?.myVote ?? null;

    try {
      if (current === nextVote) {
        const { error } = await supabase
          .from("comment_votes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", userId);
        if (error) throw error;
      } else if (current === null) {
        const { error } = await supabase.from("comment_votes").insert({
          comment_id: commentId,
          user_id: userId,
          vote: nextVote,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_votes")
          .update({ vote: nextVote })
          .eq("comment_id", commentId)
          .eq("user_id", userId);
        if (error) throw error;
      }

      await loadAll();
    } catch (err: any) {
      setMessage(`Vote failed: ${err?.message || "unknown error"}`);
    }
  };

  const handleRating = async (stars: number) => {
    setMessage("");
    if (!userId) {
      setMessage("Log in to rate articles.");
      return;
    }

    try {
      if (myRating) {
        const { error } = await supabase
          .from("ratings")
          .update({ stars })
          .eq("article_id", id)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ratings").insert({
          article_id: id,
          user_id: userId,
          stars,
        });
        if (error) throw error;
      }

      setMyRating(stars);
      setMessage(`You rated this ${stars} star${stars === 1 ? "" : "s"}.`);
      await loadAll();
    } catch (err: any) {
      setMessage(`Rating failed: ${err?.message || "unknown error"}`);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-300">Loading article...</p>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-200 mb-4">{error || "Article not found."}</p>
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

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-4">
        <span
          className={`px-2.5 py-1 rounded-md font-semibold ${
            isSatire
              ? "bg-purple-500/15 text-purple-200"
              : "bg-forge-accent/15 text-forge-accent"
          }`}
        >
          {article.section}
        </span>
        <span title={formatTimeFull(article.created_at)}>
          {formatTime(article.created_at)}
        </span>
        {avgRating !== null && (
          <span className="text-yellow-300">
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
          <div className="text-sm text-gray-300">Rank —</div>
        </div>
      </Link>

      <article className="max-w-none mb-10">
        {article.body.split("\n").filter(Boolean).map((paragraph, i) => (
          <p key={i} className="text-gray-100 leading-relaxed mb-5">
            {paragraph}
          </p>
        ))}
      </article>

      <div className="mb-10 p-5 bg-forge-900 border border-forge-800 rounded-2xl">
        <div className="text-sm text-gray-300 mb-2">Rate this article</div>
        <div className="flex items-center gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className={`transition hover:scale-110 ${
                (myRating ?? 0) >= star ? "text-yellow-300" : "text-gray-500"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <section className="border-t border-forge-800 pt-8">
        <h3 className="text-xl font-bold mb-5">
          Comments ({comments.length})
        </h3>

        <div className="bg-forge-900 border border-forge-800 rounded-2xl p-4 mb-6">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              userId
                ? "Write a comment..."
                : "Write a guest comment (no account needed)..."
            }
            className="w-full min-h-[100px] bg-black/20 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={handleComment}
              disabled={posting}
              className="px-5 py-2 bg-forge-accent hover:bg-forge-accentHover text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
            >
              {posting ? "Posting..." : userId ? "Post Comment" : "Post as Guest"}
            </button>
          </div>
        </div>

        {message && <p className="text-sm text-yellow-200 mb-4">{message}</p>}

        {comments.length === 0 ? (
          <div className="bg-forge-900/50 border border-forge-800 rounded-xl p-6 text-center text-sm text-gray-300">
            No comments yet. Jump in.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => {
              const v = votes[c.id] || {
                up: 0,
                down: 0,
                myVote: null,
                upVoters: [],
                downVoters: [],
              };

              const upTitle =
                v.upVoters.length > 0
                  ? v.upVoters.map((x) => x.name).join(", ")
                  : "No upvotes yet";
              const downTitle =
                v.downVoters.length > 0
                  ? v.downVoters.map((x) => x.name).join(", ")
                  : "No downvotes yet";

              return (
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
                      <span className="font-medium text-gray-200">
                        {c.author_name}
                        <span className="ml-2 text-xs text-gray-400">guest</span>
                      </span>
                    )}
                    <span
                      className="text-gray-300 text-xs"
                      title={formatTimeFull(c.created_at)}
                    >
                      {formatTime(c.created_at)}
                    </span>
                  </div>

                  <p className="text-gray-100 text-sm leading-relaxed mb-3">{c.body}</p>

                  <div className="flex items-center gap-3 text-sm">
                    <button
                      title={upTitle}
                      onClick={() => handleCommentVote(c.id, 1)}
                      className={`px-2 py-1 rounded-lg transition ${
                        v.myVote === 1
                          ? "bg-green-600/30 text-green-300"
                          : "bg-black/20 text-gray-300 hover:text-white"
                      }`}
                    >
                      👍 {v.up}
                    </button>
                    <button
                      title={downTitle}
                      onClick={() => handleCommentVote(c.id, -1)}
                      className={`px-2 py-1 rounded-lg transition ${
                        v.myVote === -1
                          ? "bg-red-600/30 text-red-300"
                          : "bg-black/20 text-gray-300 hover:text-white"
                      }`}
                    >
                      👎 {v.down}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-10">
        <Link href="/" className="text-sm text-gray-300 hover:text-white transition">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
