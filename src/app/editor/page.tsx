"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("Sports");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedInName, setLoggedInName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setLoggedInName(null);
        return;
      }

      const name =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "User";

      setLoggedInName(name);
    };
    checkAuth();
  }, []);

  const awardPoints = async (
    userId: string,
    points: number,
    reason: string,
    articleId: string
  ) => {
    // ledger row
    await supabase.from("points_ledger").insert({
      user_id: userId,
      points,
      reason,
      article_id: articleId,
    });

    // update profile balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .maybeSingle();

    const current = profile?.points ?? 0;
    await supabase.from("profiles").upsert({
      id: userId,
      points: current + points,
      updated_at: new Date().toISOString(),
    });
  };

  const handlePublish = async () => {
    setMessage("");
    setPublishedId(null);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setMessage("You are not logged in. Go to Log in, then come back.");
        setLoading(false);
        return;
      }

      if (!title.trim() || !body.trim()) {
        setMessage("Please add a title and article text.");
        setLoading(false);
        return;
      }

      const authorName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Anonymous";

      const { data, error } = await supabase
        .from("articles")
        .insert({
          user_id: user.id,
          title: title.trim(),
          section,
          body: body.trim(),
          author_name: authorName,
        })
        .select("id")
        .single();

      if (error) {
        setMessage(`Publish failed: ${error.message}`);
      } else {
        const reward = section === "Satire" ? 5 : 50;
        const reason =
          section === "Satire"
            ? "Published satire article"
            : "Published real article";

        await awardPoints(user.id, reward, reason, data.id);

        setMessage(`Published successfully. +${reward} points`);
        setPublishedId(data.id);
        setTitle("");
        setBody("");
        setSection("Sports");
      }
    } catch (err) {
      setMessage("Something went wrong while publishing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Write Article</h1>
        <p className="text-gray-300 text-sm">
          Real articles earn +50 points. Satire earns +5.
        </p>
        <p className="text-sm mt-2">
          {loggedInName ? (
            <span className="text-green-300">Logged in as {loggedInName}</span>
          ) : (
            <span className="text-red-300">Not logged in</span>
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Strong, clear title..."
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none"
          >
            <option>Sports</option>
            <option>Pop Culture</option>
            <option>Satire</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-1.5">Article text</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your article here..."
          className="w-full min-h-[280px] bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="px-6 py-2.5 bg-forge-accent hover:bg-forge-accentHover text-white font-medium rounded-xl transition text-sm disabled:opacity-60"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
        <Link href="/login" className="text-sm text-gray-300 hover:text-white transition">
          Go to Login
        </Link>
      </div>

      {message && (
        <div className="mt-4 text-sm text-yellow-200">
          <p>{message}</p>
          {publishedId && (
            <Link
              href={`/article/${publishedId}`}
              className="inline-block mt-2 text-forge-accent hover:text-orange-300 font-medium"
            >
              View article →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
