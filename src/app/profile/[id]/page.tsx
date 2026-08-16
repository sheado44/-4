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

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [displayName, setDisplayName] = useState("User");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, link, sex, age, location")
        .eq("id", id)
        .maybeSingle();

      const { data: articleData } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, author_name")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      setArticles(
        (articleData || []).map((a) => ({
          id: a.id,
          title: a.title,
          section: a.section,
          body: a.body,
          created_at: a.created_at,
        }))
      );

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      } else if (articleData && articleData[0]?.author_name) {
        setDisplayName(articleData[0].author_name);
      } else {
        const { data: commentData } = await supabase
          .from("comments")
          .select("author_name")
          .eq("user_id", id)
          .limit(1);
        if (commentData?.[0]?.author_name) {
          setDisplayName(commentData[0].author_name);
        }
      }

      setBio(profile?.bio || "");
      setLink(profile?.link || "");
      setSex(profile?.sex || "");
      setAge(profile?.age ?? null);
      setLocation(profile?.location || "");
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

      <h2 className="text-lg font-semibold mb-4">Articles</h2>

      {articles.length === 0 ? (
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
      )}
    </main>
  );
}
