"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditorClient() {
  const searchParams = useSearchParams();
  const presetSection = searchParams.get("section") || "Sports";

  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [section, setSection] = useState(presetSection);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data.user));
      setChecking(false);
    };
    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (presetSection) setSection(presetSection);
  }, [presetSection]);

  const publish = async () => {
    setMessage("");
    setPublishedId(null);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setMessage("Please log in to publish.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setMessage("Title and body are required.");
      return;
    }

    setPublishing(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const authorName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "User";

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: title.trim(),
        body: body.trim(),
        section,
        user_id: user.id,
        author_name: authorName,
      })
      .select("id")
      .single();

    setPublishing(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPublishedId(data.id);
    setMessage("Published successfully.");
    setTitle("");
    setBody("");
  };

  if (checking) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-pit">
        Checking account...
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--pit-text)" }}>
          Editors only
        </h1>
        <p className="text-muted-pit mb-6">
          You need a The Ballpit account to write articles, upload media, and use AI tools.
        </p>
        <Link href="/login" className="btn-write inline-block px-6 py-2.5 rounded-xl text-sm">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--pit-text)" }}>
        Write on The Ballpit
      </h1>

      <div className="pit-panel p-5 space-y-4">
        <div>
          <label className="text-xs text-muted-pit block mb-1">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
          >
            <option value="Sports">Sports</option>
            <option value="Pop Culture">Pop Culture</option>
            <option value="Satire">Satire</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-pit block mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            placeholder="Headline"
          />
        </div>

        <div>
          <label className="text-xs text-muted-pit block mb-1">Article</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full rounded-xl px-3 py-2 text-sm"
            placeholder="Write your story..."
          />
        </div>

        <button
          type="button"
          onClick={publish}
          disabled={publishing}
          className="btn-write px-5 py-2.5 rounded-xl text-sm disabled:opacity-60"
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>

        {message && (
          <p className="text-sm text-muted-pit">
            {message}{" "}
            {publishedId && (
              <Link href={`/article/${publishedId}`} className="text-highlight-pit underline">
                View article
              </Link>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
