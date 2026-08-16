"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("Sports");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setLoggedInEmail(data.session?.user?.email ?? null);
    };
    checkAuth();
  }, []);

  const handlePublish = async () => {
    setMessage("");
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

      const { error } = await supabase.from("articles").insert({
        user_id: user.id,
        title: title.trim(),
        section,
        body: body.trim(),
        author_name: authorName,
      });

      if (error) {
        setMessage(`Publish failed: ${error.message}`);
      } else {
        setMessage("Published successfully.");
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
        <p className="text-gray-400 text-sm">
          Publish a real article to your PressMe account.
        </p>
        <p className="text-sm mt-2">
          {loggedInEmail ? (
            <span className="text-green-400">Logged in as {loggedInEmail}</span>
          ) : (
            <span className="text-red-400">Not logged in</span>
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Strong, clear title..."
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none"
          >
            <option>Sports</option>
            <option>Pop Culture</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1.5">Article text</label>
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
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
          Go to Login
        </Link>
      </div>

      {message && <p className="mt-4 text-sm text-yellow-300">{message}</p>}
    </main>
  );
}
