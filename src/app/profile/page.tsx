"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatTime, formatTimeFull } from "@/lib/time";

type ProfileUser = {
  id: string;
  email?: string;
  displayName: string;
  initials: string;
  avatarUrl: string;
  bio: string;
  link: string;
  sex: string;
  age: number | null;
  location: string;
  points: number;
};

type Article = {
  id: string;
  title: string;
  section: string;
  body: string;
  created_at: string;
};

type Comment = {
  id: string;
  article_id: string;
  body: string;
  created_at: string;
  article_title?: string;
};

type ReactionItem = {
  vote: number;
  comment_id: string;
  comment_body: string;
  comment_author: string;
  article_id: string;
  article_title: string;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [upReceived, setUpReceived] = useState(0);
  const [downReceived, setDownReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"articles" | "comments" | "satire" | "reactions">("articles");

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, link, sex, age, location, points, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();

      const displayName =
        profile?.display_name ||
        authUser.user_metadata?.display_name ||
        authUser.email?.split("@")[0] ||
        "User";

      const initials = displayName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      setUser({
        id: authUser.id,
        email: authUser.email,
        displayName,
        initials,
        avatarUrl: profile?.avatar_url || "",
        bio: profile?.bio || "",
        link: profile?.link || "",
        sex: profile?.sex || "",
        age: profile?.age ?? null,
        location: profile?.location || "",
        points: profile?.points ?? 0,
      });

      const { data: articleData } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });
      setArticles(articleData || []);

      const { data: commentData } = await supabase
        .from("comments")
        .select("id, article_id, body, created_at")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      const commentsWithTitles: Comment[] = [];
      for (const comment of commentData || []) {
        const { data: art } = await supabase
          .from("articles")
          .select("title")
          .eq("id", comment.article_id)
          .single();
        commentsWithTitles.push({
          ...comment,
          article_title: art?.title || "Article",
        });
      }
      setComments(commentsWithTitles);

      const myCommentIds = (commentData || []).map((c) => c.id);
      let up = 0;
      let down = 0;
      if (myCommentIds.length > 0) {
        const { data: receivedVotes } = await supabase
          .from("comment_votes")
          .select("vote")
          .in("comment_id", myCommentIds);
        (receivedVotes || []).forEach((v) => {
          if (v.vote === 1) up += 1;
          if (v.vote === -1) down += 1;
        });
      }
      setUpReceived(up);
      setDownReceived(down);

      const { data: myVotes } = await supabase
        .from("comment_votes")
        .select("vote, comment_id, created_at")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      const reactionItems: ReactionItem[] = [];
      for (const vote of myVotes || []) {
        const { data: targetComment } = await supabase
          .from("comments")
          .select("id, body, author_name, article_id")
          .eq("id", vote.comment_id)
          .maybeSingle();
        if (!targetComment) continue;
        const { data: art } = await supabase
          .from("articles")
          .select("title")
          .eq("id", targetComment.article_id)
          .maybeSingle();
        reactionItems.push({
          vote: vote.vote,
          comment_id: targetComment.id,
          comment_body: targetComment.body,
          comment_author: targetComment.author_name,
          article_id: targetComment.article_id,
          article_title: art?.title || "Article",
          created_at: vote.created_at,
        });
      }
      setReactions(reactionItems);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-gray-300">Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-3">You’re not logged in</h1>
        <Link href="/login" className="text-forge-accent">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  const details = [user.sex, user.age ? `${user.age}` : "", user.location].filter(Boolean);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover mb-5 border-4 border-forge-800 shadow-lg"
          />
        ) : (
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-blue-600 flex items-center justify-center text-5xl md:text-6xl font-bold mb-5 border-4 border-forge-800 shadow-lg">
            {user.initials}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold mb-1">{user.displayName}</h1>
        <p className="text-gray-300 mb-2">{user.email}</p>

        {details.length > 0 && (
          <p className="text-sm text-gray-300 mb-3">{details.join(" · ")}</p>
        )}

        {user.bio && <p className="text-gray-100 text-sm max-w-xl mb-3">{user.bio}</p>}

        {user.link && (
          <a
            href={user.link.startsWith("http") ? user.link : `https://${user.link}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-forge-accent hover:text-orange-300 mb-4"
          >
            {user.link}
          </a>
        )}

        <Link
          href="/settings"
          className="mb-5 px-4 py-2 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm transition"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{articles.length}</div>
          <div className="text-xs text-gray-300 mt-1">Articles</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{comments.length}</div>
          <div className="text-xs text-gray-300 mt-1">Comments</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-300">{upReceived}</div>
          <div className="text-xs text-gray-300 mt-1">Upvotes Received</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-300">{downReceived}</div>
          <div className="text-xs text-gray-300 mt-1">Downvotes Received</div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-forge-800 mb-6 text-sm font-medium overflow-x-auto justify-center md:justify-start">
        <button
          onClick={() => setActiveTab("articles")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "articles"
              ? "border-b-2 border-forge-accent text-forge-accent"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Articles
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "comments"
              ? "border-b-2 border-forge-accent text-forge-accent"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setActiveTab("reactions")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "reactions"
              ? "border-b-2 border-forge-accent text-forge-accent"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Reactions
        </button>
        <button
          onClick={() => setActiveTab("satire")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "satire"
              ? "border-b-2 border-purple-300 text-purple-200"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Satire
        </button>
      </div>

      {activeTab === "articles" && (
        articles.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
            <p className="text-gray-100 font-medium mb-1">No articles yet</p>
            <Link href="/editor" className="text-sm text-forge-accent">
              Write an article →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="block bg-forge-900 border border-forge-800 rounded-xl p-5 hover:border-forge-700 transition"
              >
                <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                  <span className="text-forge-accent font-medium">{article.section}</span>
                  <span>•</span>
                  <span title={formatTimeFull(article.created_at)}>
                    {formatTime(article.created_at)}
                  </span>
                </div>
                <h2 className="text-lg font-bold mb-2">{article.title}</h2>
                <p className="text-gray-300 text-sm line-clamp-3">{article.body}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "comments" && (
        comments.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
            <p className="text-gray-100 font-medium mb-1">No comments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/article/${comment.article_id}`}
                className="block bg-forge-900 border border-forge-800 rounded-xl p-5 hover:border-forge-700 transition"
              >
                <div className="text-xs text-gray-300 mb-2">
                  On <span className="text-white">{comment.article_title}</span>
                  {" · "}
                  <span title={formatTimeFull(comment.created_at)}>
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-100 text-sm leading-relaxed">{comment.body}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "reactions" && (
        reactions.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
            <p className="text-gray-100 font-medium mb-1">No reactions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reactions.map((r) => (
              <Link
                key={`${r.comment_id}-${r.created_at}`}
                href={`/article/${r.article_id}`}
                className="block bg-forge-900 border border-forge-800 rounded-xl p-5 hover:border-forge-700 transition"
              >
                <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                  <span className={r.vote === 1 ? "text-green-300 font-semibold" : "text-red-300 font-semibold"}>
                    {r.vote === 1 ? "👍 Upvoted" : "👎 Downvoted"}
                  </span>
                  <span>•</span>
                  <span title={formatTimeFull(r.created_at)}>{formatTime(r.created_at)}</span>
                </div>
                <div className="text-sm text-gray-300 mb-1">
                  Comment by <span className="text-white font-medium">{r.comment_author}</span>
                  {" on "}
                  <span className="text-white">{r.article_title}</span>
                </div>
                <p className="text-gray-100 text-sm leading-relaxed line-clamp-3">{r.comment_body}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "satire" && (
        <div className="bg-forge-900 border border-purple-500/20 rounded-2xl p-10 text-center">
          <p className="text-gray-100 font-medium mb-1">No satire yet</p>
          <Link href="/fan-fiction" className="text-sm text-purple-200">
            Write Satire →
          </Link>
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="text-sm text-gray-300 hover:text-white transition"
        >
          Log out
        </button>
      </div>
    </main>
  );
}
