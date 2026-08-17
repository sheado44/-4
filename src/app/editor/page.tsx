"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("Sports");
  const [body, setBody] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loggedInName, setLoggedInName] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const loadUser = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      setUserId(null);
      setLoggedInName(null);
      setAiCredits(0);
      return;
    }
    setUserId(user.id);
    setLoggedInName(
      user.user_metadata?.display_name || user.email?.split("@")[0] || "User"
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_credits")
      .eq("id", user.id)
      .maybeSingle();
    setAiCredits(profile?.ai_credits ?? 0);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const wrapSelection = (before: string, after = before) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end) || "text";
    setBody(body.slice(0, start) + before + selected + after + body.slice(end));
  };

  const insertAtCursor = (text: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setBody(body.slice(0, start) + text + body.slice(end));
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

  const spendAiCredit = async () => {
    if (!userId) return { ok: false, reason: "Log in first." };
    if (aiCredits < 1) return { ok: false, reason: "No AI credits left." };

    const next = aiCredits - 1;
    const { error } = await supabase
      .from("profiles")
      .update({ ai_credits: next, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) return { ok: false, reason: error.message };

    setAiCredits(next);
    return { ok: true, reason: "" };
  };

  // Placeholder until xAI image API is connected
  const generateWithXAI = async (prompt: string) => {
    // TODO: call xAI image endpoint here
    // For now return a deterministic placeholder image service based on prompt
    const encoded = encodeURIComponent(prompt.slice(0, 40) || "ballpit");
    return {
      ok: true,
      url: `https://placehold.co/1024x768/1f2937/f97316/png?text=${encoded}`,
      reviewed: false,
      reviewNote:
        "Placeholder image only. Connect xAI API for real generation. Failed reviews will not refund credits.",
    };
  };

  const reviewImage = async (prompt: string) => {
    // Lightweight pre-filter before/after generation
    const banned = ["nude", "nsfw", "porn", "explicit", "gore"];
    const lower = prompt.toLowerCase();
    if (banned.some((w) => lower.includes(w))) {
      return {
        ok: false,
        reason:
          "Generation used 1 credit and did not pass review. No refund.",
      };
    }
    // Future: real AI decency + relevance scoring
    return { ok: true, reason: "" };
  };

  const handleGenerateAiImage = async (target: "inline" | "thumbnail") => {
    setUploadStatus("");
    if (!userId) {
      setUploadStatus("Log in to generate AI images.");
      return;
    }
    if (!aiPrompt.trim() || aiPrompt.trim().length < 8) {
      setUploadStatus("Write a clearer prompt (at least 8 characters).");
      return;
    }

    setGenerating(true);

    // Spend first, no refund policy
    const spend = await spendAiCredit();
    if (!spend.ok) {
      setUploadStatus(spend.reason);
      setGenerating(false);
      return;
    }

    const review = await reviewImage(aiPrompt);
    if (!review.ok) {
      setUploadStatus(review.reason);
      setGenerating(false);
      return;
    }

    const result = await generateWithXAI(aiPrompt.trim());
    if (!result.ok || !result.url) {
      setUploadStatus(
        "Generation used 1 credit and failed. No refund."
      );
      setGenerating(false);
      return;
    }

    if (target === "thumbnail") {
      setThumbnailUrl(result.url);
      setUploadStatus(
        "AI thumbnail set (placeholder provider). 1 credit used. " + result.reviewNote
      );
    } else {
      insertAtCursor(`\n![AI image](${result.url})\n`);
      setUploadStatus(
        "AI image inserted (placeholder provider). 1 credit used. " + result.reviewNote
      );
    }

    setGenerating(false);
  };

  const mockAiReviewUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return { ok: false, reason: "File must be an image." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, reason: "Image must be under 5MB." };
    }
    return { ok: true, reason: "" };
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "thumbnail" | "inline"
  ) => {
    setUploadStatus("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) {
      setUploadStatus("Log in to upload images.");
      return;
    }

    setUploading(true);
    const review = await mockAiReviewUpload(file);
    if (!review.ok) {
      setUploadStatus(review.reason);
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("article-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploadStatus(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("article-images")
      .getPublicUrl(path);
    const url = publicData.publicUrl;

    if (target === "thumbnail") {
      setThumbnailUrl(url);
      setUploadStatus("Thumbnail uploaded.");
    } else {
      insertAtCursor(`\n![image](${url})\n`);
      setUploadStatus("Inline image uploaded.");
    }
    setUploading(false);
  };

  const awardPoints = async (
    uid: string,
    points: number,
    reason: string,
    articleId: string
  ) => {
    await supabase.from("points_ledger").insert({
      user_id: uid,
      points,
      reason,
      article_id: articleId,
    });
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", uid)
      .maybeSingle();
    await supabase.from("profiles").upsert({
      id: uid,
      points: (profile?.points ?? 0) + points,
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
        await awardPoints(
          user.id,
          reward,
          section === "Satire" ? "Published satire article" : "Published real article",
          data.id
        );
        setMessage(`Published successfully. +${reward} points`);
        setPublishedId(data.id);
        setTitle("");
        setBody("");
        setThumbnailUrl("");
        setAiPrompt("");
        setSection("Sports");
      }
    } catch {
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
    .replace(
      /!\[(.*?)\]\((.*?)\)/gim,
      '<img alt="$1" src="$2" class="max-w-full rounded-xl my-3" />'
    )
    .replace(
      /\[(.*?)\]\((.*?)\)/gim,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-orange-300 underline">$1</a>'
    )
    .replace(/\n/g, "<br />");

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Write Article</h1>
        <p className="text-gray-300 text-sm">
          Storytelling tools with upload + AI image generation (xAI-ready).
        </p>
        <p className="text-sm mt-2">
          {loggedInName ? (
            <span className="text-green-300">
              Logged in as {loggedInName} · AI credits: {aiCredits}
            </span>
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
              >
                <option>Sports</option>
                <option>Pop Culture</option>
                <option>Satire</option>
              </select>
            </div>
          </div>

          <div className="mb-4 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Upload thumbnail</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "thumbnail")} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Upload inline image</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "inline")} />
            </div>
          </div>

          <div className="mb-4 p-4 rounded-2xl border border-forge-800 bg-forge-900">
            <div className="text-sm font-medium mb-2">AI Image (xAI-ready)</div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the image for your story..."
              className="w-full min-h-[90px] bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm outline-none mb-3"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerateAiImage("inline")}
                className="px-3 py-2 rounded-lg bg-forge-accent text-white text-sm disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate inline (1 credit)"}
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerateAiImage("thumbnail")}
                className="px-3 py-2 rounded-lg bg-black/20 text-sm disabled:opacity-60"
              >
                Generate thumbnail (1 credit)
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Failed reviews are not refunded.
            </p>
          </div>

          {(uploading || uploadStatus) && (
            <p className="text-sm text-yellow-200 mb-3">{uploading ? "Uploading..." : uploadStatus}</p>
          )}

          <div className="mb-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => wrapSelection("**")} className="px-3 py-1.5 rounded-lg bg-black/20 text-sm">Bold</button>
            <button type="button" onClick={() => wrapSelection("*")} className="px-3 py-1.5 rounded-lg bg-black/20 text-sm">Italic</button>
            <button type="button" onClick={() => insertAtCursor("\n# ")} className="px-3 py-1.5 rounded-lg bg-black/20 text-sm">H1</button>
            <button type="button" onClick={() => insertAtCursor("\n## ")} className="px-3 py-1.5 rounded-lg bg-black/20 text-sm">H2</button>
            <button type="button" onClick={addLink} className="px-3 py-1.5 rounded-lg bg-black/20 text-sm">Link</button>
          </div>

          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full min-h-[300px] bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
            placeholder="Write your article..."
          />

          <div className="mt-4">
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-6 py-2.5 bg-forge-accent text-white font-medium rounded-xl text-sm disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>

          {message && (
            <div className="mt-4 text-sm text-yellow-200">
              <p>{message}</p>
              {publishedId && (
                <Link href={`/article/${publishedId}`} className="inline-block mt-2 text-forge-accent">
                  View article →
                </Link>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-300 mb-2">Live preview</div>
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 min-h-[500px]">
            <h2 className="text-2xl font-bold mb-4">{title || "Untitled article"}</h2>
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="Thumbnail" className="w-full max-h-56 object-cover rounded-xl mb-4" />
            )}
            <div
              className="text-gray-100 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: previewHtml || "<span class='text-gray-400'>Start writing to preview...</span>",
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
