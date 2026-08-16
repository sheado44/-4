"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProfileUser = {
  id: string;
  email?: string;
  displayName: string;
  initials: string;
  bio: string;
  link: string;
  sex: string;
  age: number | null;
  location: string;
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

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"articles" | "comments" | "satire">("articles");

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
        .select("display_name, bio, link, sex, age, location")
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
        bio: profile?.bio || "",
        link: profile?.link || "",
        sex: profile?.sex || "",
        age: profile?.age ?? null,
        location: profile?.location || "",
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
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-gray-400">Loading profile...</p>
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

  const details = [
    user.sex,
    user.age ? `${user.age}` : "",
    user.location,
  ].filter(Boolean);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-blue-600 flex items-center justify-center text-5xl md:text-6xl font-bold mb-5 border-4 border-forge-800 shadow-lg">
          {user.initials}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-1">{user.displayName}</h1>
        <p className="text-gray-400 mb-2">{user.email}</p>

        {details.length > 0 && (
          <p className="text-sm text-gray-400 mb-3">{details.join(" · ")}</p>
        )}

        {user.bio && (
          <p className="text-gray-300 text-sm max-w-xl mb-3">{user.bio}</p>
        )}

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

        <div className="flex flex-wrap justify-center gap-3">
          <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
            <div className="text-xs text-gray-400">Publisher Rank</div>
            <div className="font-bold text-gray-300 text-lg">—</div>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
            <div className="text-xs text-gray-400">Commenter Rank</div>
            <div className="font-bold text-gray-300 text-lg">—</div>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
            <div className="text-xs text-gray-400">Heat</div>
            <div className="font-bold text-gray-300 text-lg">—</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{articles.length}</div>
          <div className="text-xs text-gray-400 mt-1">Articles</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-xs text-gray-400 mt-1">Article Views</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{comments.length}</div>
          <div className="text-xs text-gray-400 mt-1">Comments</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-xs text-gray-400 mt-1">Likes Received</div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-forge-800 mb-6 text-sm font-medium overflow-x-auto justify-center md:justify-start">
        <button
          onClick={() => setActiveTab("articles")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "articles"
              ? "border-b-2 border-forge-accent text-forge-accent"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Articles
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "comments"
              ? "border-b-2 border-forge-accent text-forge-accent"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setActiveTab("satire")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "satire"
              ? "border-b-2 border-purple-400 text-purple-300"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Satire
        </button>
      </div>

      {activeTab === "articles" && (
        articles.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
            <p className="text-gray-300 font-medium mb-1">No articles yet</p>
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
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span className="text-forge-accent font-medium">{article.section}</span>
                  <span>•</span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
                <h2 className="text-lg font-bold mb-2">{article.title}</h2>
                <p className="text-gray-400 text-sm line-clamp-3">{article.body}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "comments" && (
        comments.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
            <p className="text-gray-300 font-medium mb-1">No comments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/article/${comment.article_id}`}
                className="block bg-forge-900 border border-forge-800 rounded-xl p-5 hover:border-forge-700 transition"
              >
                <div className="text-xs text-gray-500 mb-2">
                  On <span className="text-gray-300">{comment.article_title}</span>
                  {" · "}
                  {new Date(comment.created_at).toLocaleString()}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{comment.body}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "satire" && (
        <div className="bg-forge-900 border border-purple-500/20 rounded-2xl p-10 text-center">
          <p className="text-gray-300 font-medium mb-1">No satire yet</p>
          <Link href="/fan-fiction" className="text-sm text-purple-300">
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
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Log out
        </button>
      </div>
    </main>
  );
}
