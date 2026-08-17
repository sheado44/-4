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
};

type Comment = {
  id: string;
  article_id: string;
  body: string;
  created_at: string;
  article_title?: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [displayName, setDisplayName] = useState("User");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<"articles" | "comments" | "satire">("articles");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, link, sex, age, location, updated_at")
        .eq("id", id)
        .maybeSingle();

      const { data: articleData } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, author_name")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      const mappedArticles = (articleData || []).map((a) => ({
        id: a.id,
        title: a.title,
        section: a.section,
        body: a.body,
        created_at: a.created_at,
      }));
      setArticles(mappedArticles);

      const { data: commentData } = await supabase
        .from("comments")
        .select("id, article_id, body, created_at")
        .eq("user_id", id)
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

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      } else if (articleData && articleData[0]?.author_name) {
        setDisplayName(articleData[0].author_name);
      } else if (commentsWithTitles.length > 0) {
        // fallback already handled by comment author fetch below if needed
      } else {
        const { data: commentName } = await supabase
          .from("comments")
          .select("author_name")
          .eq("user_id", id)
          .limit(1);
        if (commentName?.[0]?.author_name) {
          setDisplayName(commentName[0].author_name);
        }
      }

      setBio(profile?.bio || "");
      setLink(profile?.link || "");
      setSex(profile?.sex || "");
      setAge(profile?.age ?? null);
      setLocation(profile?.location || "");
      setUpdatedAt(profile?.updated_at || null);
      setLoading(false);
    };

    load();
  }, [id]);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const details = [sex, age ? String(age) : "", location].filter(Boolean);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-gray-300">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-blue-600 flex items-center justify-center text-5xl md:text-6xl font-bold mb-5 border-4 border-forge-800 shadow-lg">
          {initials}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">{displayName}</h1>

        {details.length > 0 && (
          <p className="text-sm text-gray-300 mb-3">{details.join(" · ")}</p>
        )}

        {bio && <p className="text-gray-100 text-sm max-w-xl mb-3">{bio}</p>}

        {link && (
          <a
            href={link.startsWith("http") ? link : `https://${link}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-forge-accent hover:text-orange-300 mb-2"
          >
            {link}
          </a>
        )}
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
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-8 text-center text-gray-300 text-sm">
            No articles yet.
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
                <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                <p className="text-gray-300 text-sm line-clamp-3">{article.body}</p>
                <div className="text-xs text-forge-accent mt-3">Read article →</div>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "comments" && (
        comments.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-8 text-center text-gray-300 text-sm">
            No comments yet.
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

      {activeTab === "satire" && (
        <div className="bg-forge-900 border border-purple-500/20 rounded-2xl p-8 text-center text-gray-300 text-sm">
          No satire yet.
        </div>
      )}

      {updatedAt && (
        <div className="mt-10 pt-6 border-t border-forge-800 text-center text-xs text-gray-300">
          <span title={formatTimeFull(updatedAt)}>
            Profile updated {formatTime(updatedAt)}
          </span>
        </div>
      )}
    </main>
  );
}
