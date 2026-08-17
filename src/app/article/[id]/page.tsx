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
  parent_id: string | null;
};

type Voter = { user_id: string; name: string };
type VoteInfo = {
  up: number;
  down: number;
  myVote: number | null;
  upVoters: Voter[];
  downVoters: Voter[];
};
type VoteMap = Record<string, VoteInfo>;

function makeGuestName() {
  return `anon_${Math.random().toString(16).slice(2, 8)}`;
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
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
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
      .select("id, author_name, body, created_at, is_guest, user_id, parent_id")
      .eq("article_id", id)
      .order("created_at", { ascending: true });

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
      const { data: voteData, error: voteError } = await supabase
        .from("comment_votes")
        .select("comment_id, user_id, vote")
        .in("comment_id", commentIds);

      if (voteError) {
        console.error("Vote load error:", voteError.message);
      }

      const voterIds = Array.from(new Set((voteData || []).map((v) => v.user_id)));
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
      parent_id: replyTo ? replyTo.id : null,
    });

    if (error) {
      setMessage(`Comment failed: ${error.message}`);
    } else {
      setCommentText("");
      setReplyTo(null);
      setMessage(isLoggedIn ? "Comment posted." : `Guest comment posted as ${authorName}.`);
      await loadAll();
    }
    setPosting(false);
  };

  const handleCommentVote = async (comment: Comment, nextVote: 1 | -1) => {
    setMessage("");
    if (!userId) {
      setMessage("Log in to vote on comments.");
      return;
    }
    if (comment.user_id && comment.user_id === userId) {
      setMessage("You can’t vote on your own comment.");
      return;
    }

    const current = votes[comment.id]?.myVote ?? null;
    try {
      if (current === nextVote) {
        const { error } = await supabase
          .from("comment_votes")
          .delete()
          .eq("comment_id", comment.id)
          .eq("user_id", userId);
        if (error) throw error;
      } else if (current === null) {
        const { error } = await supabase.from("comment_votes").insert({
          comment_id: comment.id,
          user_id: userId,
          vote: nextVote,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_votes")
          .update({ vote: nextVote })
          .eq("comment_id", comment.id)
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
    if (article && article.user_id === userId) {
      setMessage("You can’t rate your own article.");
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
        <Link href="/" className="text-forge-accent text-sm">
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

  const isOwnArticle = Boolean(userId && article.user_id === userId);
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent: Record<string, Comment[]> = {};
  comments.forEach((c) => {
    if (c.parent_id) {
      if (!repliesByParent[c.parent_id]) repliesByParent[c.parent_id] = [];
      repliesByParent[c.parent_id].push(c);
    }
  });

  const renderComment = (c: Comment, isReply = false) => {
    const v = votes[c.id] || {
      up: 0,
      down: 0,
      myVote: null,
      upVoters: [],
      downVoters: [],
    };
    const isOwnComment = Boolean(userId && c.user_id === userId);
    const upTitle =
      v.upVoters.length > 0 ? v.upVoters.map((x) => x.name).join(", ") : "No upvotes yet";
    const downTitle =
      v.downVoters.length > 0
        ? v.downVoters.map((x) => x.name).join(", ")
        : "No downvotes yet";

    return (
      <div
        key={c.id}
        className={`bg-forge-900 border border-forge-800 rounded-xl p-4 ${
          isReply ? "ml-6 md:ml-10" : ""
        }`}
      >
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
          <span className="text-gray-300 text-xs" title={formatTimeFull(c.created_at)}>
            {formatTime(c.created_at)}
          </span>
        </div>

        <p className="text-gray-100 text-sm leading-relaxed mb-3">{c.body}</p>

        <div className="flex items-center gap-3 text-sm">
          <button
            title={isOwnComment ? "You can’t vote on your own comment" : upTitle}
            onClick={() => handleCommentVote(c, 1)}
            disabled={isOwnComment}
            className={`px-2 py-1 rounded-lg transition ${
              isOwnComment
                ? "bg-black/10 text-gray-500 cursor-not-allowed"
                : v.myVote === 1
                ? "bg-green-600/30 text-green-300"
                : "bg-black/20 text-gray-300 hover:text-white"
            }`}
          >
            👍 {v.up}
          </button>
          <button
            title={isOwnComment ? "You can’t vote on your own comment" : downTitle}
            onClick={() => handleCommentVote(c, -1)}
            disabled={isOwnComment}
            className={`px-2 py-1 rounded-lg transition ${
              isOwnComment
                ? "bg-black/10 text-gray-500 cursor-not-allowed"
                : v.myVote === -1
                ? "bg-red-600/30 text-red-300"
                : "bg-black/20 text-gray-300 hover:text-white"
            }`}
          >
            👎 {v.down}
          </button>
          <button
            onClick={() => {
              setReplyTo(c);
              setMessage("");
            }}
            className="px-2 py-1 rounded-lg bg-black/20 text-gray-300 hover:text-white transition"
          >
            Reply
          </button>
        </div>
      </div>
    );
  };

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
          <div className="font-semibold group-hover:text-forge-accent transition">{author}</div>
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
              disabled={isOwnArticle}
              className={`transition hover:scale-110 ${
                isOwnArticle
                  ? "text-gray-600 cursor-not-allowed"
                  : (myRating ?? 0) >= star
                  ? "text-yellow-300"
                  : "text-gray-500"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-300 mt-2">
          {isOwnArticle
            ? "You can’t rate your own article."
            : userId
            ? myRating
              ? `Your rating: ${myRating} star${myRating === 1 ? "" : "s"}`
              : "Click a star to rate"
            : "Log in to rate"}
        </p>
      </div>

      <section className="border-t border-forge-800 pt-8">
        <h3 className="text-xl font-bold mb-5">Comments ({comments.length})</h3>

        <div className="bg-forge-900 border border-forge-800 rounded-2xl p-4 mb-6">
          {replyTo && (
            <div className="mb-3 text-sm text-gray-300 flex items-center justify-between gap-3">
              <span>
                Replying to <span className="text-white font-medium">{replyTo.author_name}</span>
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              replyTo
                ? `Reply to ${replyTo.author_name}...`
                : userId
                ? "Write a comment..."
                : "Write a guest comment..."
            }
            className="w-full min-h-[100px] bg-black/20 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
          />
          <div className="mt-3">
            <button
              onClick={handleComment}
              disabled={posting}
              className="px-5 py-2 bg-forge-accent hover:bg-forge-accentHover text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
            >
              {posting
                ? "Posting..."
                : replyTo
                ? "Post Reply"
                : userId
                ? "Post Comment"
                : "Post as Guest"}
            </button>
          </div>
        </div>

        {message && <p className="text-sm text-yellow-200 mb-4">{message}</p>}

        {topLevel.length === 0 ? (
          <div className="bg-forge-900/50 border border-forge-800 rounded-xl p-6 text-center text-sm text-gray-300">
            No comments yet. Jump in.
          </div>
        ) : (
          <div className="space-y-4">
            {topLevel.map((c) => (
              <div key={c.id} className="space-y-3">
                {renderComment(c)}
                {(repliesByParent[c.id] || []).map((r) => renderComment(r, true))}
              </div>
            ))}
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
