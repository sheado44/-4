"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("Sports");
  const [body, setBody] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [message, setMessage] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedInName, setLoggedInName] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setLoggedInName(null);
        return;
      }
      setLoggedInName(
        user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "User"
      );
    };
    checkAuth();
  }, []);

  const wrapSelection = (before: string, after = before) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end) || "text";
    const next =
      body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    });
  };

  const insertAtCursor = (text: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const addLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;
    const el = bodyRef.current;
    const selected =
      el && el.selectionStart !== el.selectionEnd
        ? body.slice(el.selectionStart, el.selectionEnd)
        : "link text";
    wrapSelection(`[${selected}](`, `${url})`);
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    insertAtCursor(`\n![image](${url})\n`);
  };

  const awardPoints = async (
    userId: string,
    points: number,
    reason: string,
    articleId: string
  ) => {
    await supabase.from("points_ledger").insert({
      user_id: userId,
      points,
      reason,
      article_id: articleId,
    });

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
        setMessage("You are not logged in.");
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

      // Keep thumbnail as markdown prefix for now if provided
      const finalBody = thumbnailUrl.trim()
        ? `![thumbnail](${thumbnailUrl.trim()})\n\n${body.trim()}`
        : body.trim();

      const { data, error } = await supabase
        .from("articles")
        .insert({
          user_id: user.id,
          title: title.trim(),
          section,
          body: finalBody,
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
        setThumbnailUrl("");
        setSection("Sports");
      }
    } catch (err) {
      setMessage("Something went wrong while publishing.");
    } finally {
      setLoading(false);
    }
  };

  const previewHtml = body
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" class="max-w-full rounded-xl my-3" />')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noreferrer" class="text-orange-300 underline">$1</a>')
    .replace(/^• (.*$)/gim, "<li>$1</li>")
    .replace(/\n/g, "<br />");

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Write Article</h1>
        <p className="text-gray-300 text-sm">
          Rich editor tools for publishers. Real articles +50 pts · Satire +5 pts.
        </p>
        <p className="text-sm mt-2">
          {loggedInName ? (
            <span className="text-green-300">Logged in as {loggedInName}</span>
          ) : (
            <span className="text-red-300">Not logged in</span>
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
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

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1.5">
              Thumbnail image URL
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
            />
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => wrapSelection("**")}
              className="px-3 py-1.5 rounded-lg bg-black/20 text-sm hover:bg-black/30"
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => wrapSelection("*")}
              className="px-3 py-1.5 rounded-lg bg-black/20 text-sm hover:bg-black/30"
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor("\n# ")}
              className="px-3 py-1.5 rounded-lg bg-black/20 text-sm hover:bg-black/30"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor("\n## ")}
              className="px-3 py-1.5 rounded-lg bg-black/20 text-sm hover:bg-black/30"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor("\n• ")}
              className="px-3 py-1.5 rounded-lg bg-black/20 text-sm hover:bg-black/30"
            >
              List
            </button>
            <button
              type="button"
              onClick={addLink}
              className="px-3 py-1.5 rounded-lg bg-black/20 text-sm hover:bg-black/30"
            >
              Link
            </button>
            <button
              type="button"
              onClick={addImage}
              className="px-3 py-1.5 rounded-lg bg-black/20 text-sm hover:bg-black/30"
            >
              Image URL
            </button
