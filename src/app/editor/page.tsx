"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ComputeButton from "@/components/ComputeButton";
import { defaultModel, type AiModel } from "@/lib/creditTable";

function isTechnicalFoul(title: string, body: string) {
  const plain = body.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").trim();
  const words = plain.split(/\s+/).filter(Boolean).length;
  return title.trim().length < 12 || words < 80;
}

function clamp100(n: number) {
  return Math.max(1, Math.min(100, Math.round(n)));
}

function scoreJournalism(title: string, body: string) {
  const plain = body.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").trim();
  const words = plain.split(/\s+/).filter(Boolean).length;
  const paras = plain.split(/\n\s*\n/).filter(Boolean).length;
  const hasNumbers = /\d/.test(plain);
  const hasQuote = /["“”']/.test(plain);
  const sourced = /according to|reported|source|official|statement/i.test(plain);
  const titleLen = title.trim().length;

  let effort = Math.min(100, words / 3.5);
  if (titleLen >= 20) effort += 6;
  if (paras >= 3) effort += 8;
  effort = clamp100(effort);

  let journalistic = 38;
  if (hasQuote) journalistic += 14;
  if (paras >= 3) journalistic += 12;
  if (words >= 200) journalistic += 12;
  if (sourced) journalistic += 14;
  if (titleLen >= 16) journalistic += 6;
  journalistic = clamp100(journalistic);

  let truth = 42;
  if (hasNumbers) truth += 18;
  if (hasQuote) truth += 12;
  if (sourced) truth += 14;
  if (words >= 150) truth += 8;
  truth = clamp100(truth);

  if (isTechnicalFoul(title, body)) {
    effort = Math.min(effort, 40);
    journalistic = Math.min(journalistic, 38);
    truth = Math.min(truth, 36);
  }

  const avg = clamp100((effort + journalistic + truth) / 3);
  return { effort, journalistic, truth, avg };
}

function EditorContent() {
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("Sports");
  const [body, setBody] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [imagePlace, setImagePlace] = useState<"top" | "middle" | "bottom" | "left" | "right" | "split">("top");
  const [aiPrompt, setAiPrompt] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);
  const [plan, setPlan] = useState<"free" | "press" | "desk">("free");
  const [imgModel, setImgModel] = useState<AiModel>("haiku");
  const [userId, setUserId] = useState<string | null>(null);
  const [loggedInName, setLoggedInName] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [review, setReview] = useState<{
    effort: number;
    journalistic: number;
    truth: number;
    avg: number;
  } | null>(null);
  const [pitStatus, setPitStatus] = useState<"draft" | "foul" | "tools" | "published">("draft");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const loadUser = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      setUserId(null);
      setLoggedInName(null);
      setAiCredits(0);
      setAuthLoading(false);
      return;
    }
    setUserId(user.id);
    setLoggedInName(
      user.user_metadata?.display_name || user.email?.split("@")[0] || "User"
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_credits, plan")
      .eq("id", user.id)
      .maybeSingle();
    setAiCredits(profile?.ai_credits ?? 0);
    const p = String(profile?.plan || "free").toLowerCase();
    setPlan(p === "desk" ? "desk" : p === "press" ? "press" : "free");
    setAuthLoading(false);
  };

  useEffect(() => {
    loadUser();

    const preset = searchParams.get("section");
    if (preset === "Sports" || preset === "Pop Culture" || preset === "Satire") {
      setSection(preset);
    }
  }, [searchParams]);

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

  const thumbQuality = plan === "desk" ? "high" : plan === "press" ? "standard" : "none";

  const generateImage = async (prompt: string, quality: "standard" | "high") => {
    const encoded = encodeURIComponent(prompt.slice(0, 48) || "theBallpit");
    const size = quality === "high" ? "1536x1024" : "1024x768";
    return {
      ok: true,
      url: `https://placehold.co/${size}/1f2937/f97316/png?text=${encoded}`,
      reviewNote:
        quality === "high"
          ? "Desk-quality placeholder. ChatGPT images will replace this when keys are live."
          : "Press-quality placeholder. ChatGPT images will replace this when keys are live.",
    };
  };

  const reviewImage = async (prompt: string) => {
    const banned = ["nude", "nsfw", "porn", "explicit", "gore"];
    const lower = prompt.toLowerCase();
    if (banned.some((w) => lower.includes(w))) {
      return {
        ok: false,
        reason: "Generation used 1 credit and did not pass review. No refund.",
      };
    }
    return { ok: true, reason: "" };
  };

  const handleGenerateInline = async () => {
    setUploadStatus("");
    if (!userId) return;
    if (!aiPrompt.trim() || aiPrompt.trim().length < 8) {
      setUploadStatus("Write a clearer prompt (at least 8 characters).");
      return;
    }
    if (plan === "free") {
      setUploadStatus("Inline AI images are a Press / Desk tool.");
      return;
    }

    setGenerating(true);
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

    const result = await generateImage(aiPrompt.trim(), plan === "desk" ? "high" : "standard");
    if (!result.ok || !result.url) {
      setUploadStatus("Generation used 1 credit and failed. No refund.");
      setGenerating(false);
      return;
    }

    insertAtCursor(`\n![img:${imagePlace}](${result.url})\n`);
    setUploadStatus(`AI image inserted (${imagePlace}). 1 credit used. ${result.reviewNote}`);
    setGenerating(false);
  };

  const handleGenerateThumbnailFromStory = async () => {
    setUploadStatus("");
    if (!userId) return;
    if (!title.trim() || body.trim().split(/\s+/).length < 20) {
      setUploadStatus("Write a title and at least a short draft first. The thumbnail is built from the story.");
      return;
    }
    if (plan === "free") {
      setUploadStatus("Story thumbnails are a Press / Desk tool. Pit Pass stays on $0 AI.");
      return;
    }

    const storyPrompt = `${title.trim()}. ${body.trim().slice(0, 280)}`;
    setGenerating(true);
    const spend = await spendAiCredit();
    if (!spend.ok) {
      setUploadStatus(spend.reason);
      setGenerating(false);
      return;
    }

    const review = await reviewImage(storyPrompt);
    if (!review.ok) {
      setUploadStatus(review.reason);
      setGenerating(false);
      return;
    }

    const result = await generateImage(storyPrompt, plan === "desk" ? "high" : "standard");
    if (!result.ok || !result.url) {
      setUploadStatus("Generation used 1 credit and failed. No refund.");
      setGenerating(false);
      return;
    }

    setThumbnailUrl(result.url);
    setUploadStatus(
      `Thumbnail built from the story (${plan === "desk" ? "Desk" : "Press"} quality). 1 credit used. ${result.reviewNote}`
    );
    setGenerating(false);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "thumbnail" | "inline"
  ) => {
    setUploadStatus("");
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      setUploadStatus("File must be an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus("Image must be under 5MB.");
      return;
    }

    setUploading(true);
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
      insertAtCursor(`\n![img:${imagePlace}](${url})\n`);
      setUploadStatus(`Inline image uploaded (${imagePlace}).`);
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

  const handleReview = async () => {
    setMessage("");
    setPublishedId(null);
    setLoading(true);
    try {
      if (!userId) {
        setMessage("You are not logged in.");
        setLoading(false);
        return;
      }
      if (!title.trim() || !body.trim()) {
        setMessage("Add a title and the story text first.");
        setLoading(false);
        return;
      }
      if (section === "Satire") {
        setMessage("Satire runs in satireLab, not this editor.");
        setLoading(false);
        return;
      }

      const scored = scoreJournalism(title.trim(), body.trim());
      setReview(scored);
      const authorName = loggedInName || "Anonymous";
      const foul = scored.avg < 55 || isTechnicalFoul(title.trim(), body.trim());
      const status = foul ? "author_only" : "desk_edit";

      const { data, error } = await supabase
        .from("articles")
        .insert({
          user_id: userId,
          title: title.trim(),
          section,
          body: body.trim(),
          author_name: authorName,
          status,
          ai_score: scored.avg,
        })
        .select("id")
        .single();

      if (error) {
        setMessage(`Review failed: ${error.message}`);
        setLoading(false);
        return;
      }

      setArticleId(data.id);
      setPublishedId(data.id);
      if (foul) {
        setPitStatus("foul");
        setMessage(
          `Technical foul. Truth ${scored.truth} · journalistic ${scored.journalistic} · effort ${scored.effort}. Desk only — tools stay locked.`
        );
      } else {
        setPitStatus("tools");
        setMessage(
          `Review passed (${scored.avg}). Tools for this story are unlocked. Throw it in the pit when the edit is done.`
        );
      }
    } catch {
      setMessage("Review failed.");
    } finally {
      setLoading(false);
    }
  };


  const handleDiscard = async () => {
    if (!userId) {
      setMessage("Log in first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const authorName = loggedInName || "Anonymous";
      if (articleId) {
        const { error } = await supabase
          .from("articles")
          .update({
            title: title.trim() || "Untitled",
            body: body.trim(),
            section,
            status: "discarded",
          })
          .eq("id", articleId)
          .eq("user_id", userId);
        if (error) {
          setMessage(error.message);
          setLoading(false);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert({
            user_id: userId,
            title: title.trim() || "Untitled",
            section,
            body: body.trim(),
            author_name: authorName,
            status: "discarded",
          })
          .select("id")
          .single();
        if (error) {
          setMessage(error.message);
          setLoading(false);
          return;
        }
        setArticleId(data.id);
        setPublishedId(data.id);
      }
      setPitStatus("published");
      setMessage("In the trashPit. Not in the feed. Only you can see it.");
    } catch {
      setMessage("Could not send to trashPit.");
    } finally {
      setLoading(false);
    }
  };

  const handleThrowInPit = async () => {
    if (!userId || !articleId) return;
    setLoading(true);
    setMessage("");
    try {
      const finalBody = thumbnailUrl.trim()
        ? `![img:${imagePlace}](${thumbnailUrl.trim()})\n\n${body.trim()}`
        : body.trim();
      const { error } = await supabase
        .from("articles")
        .update({
          title: title.trim(),
          body: finalBody,
          section,
          status: "published",
        })
        .eq("id", articleId)
        .eq("user_id", userId);
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      const reward = 50;
      await awardPoints(userId, reward, "Published real article", articleId);
      setPitStatus("published");
      setMessage(`In the pit. +${reward} points`);
      window.dispatchEvent(new Event("ballpit-wallet-updated"));
    } catch {
      setMessage("Could not throw it in the pit.");
    } finally {
      setLoading(false);
    }
  };

  const insertTable = () => {
    insertAtCursor("\n| Header | Header | Header |\n| --- | --- | --- |\n|  |  |  |\n");
  };
  const insertGraph = () => {
    insertAtCursor("\n![graph:auto](https://placehold.co/800x320/1f2937/f97316/png?text=graph)\n");
  };

  const previewHtml = body
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(
      /!\[(.*?)\]\((.*?)\)/gim,
      function (_, alt, src) {
        const place = (alt.match(/img:(\w+)/) || [])[1] || "middle";
        const cls =
          place === "left"
            ? "w-full md:w-[42%] md:float-left md:mr-4 mb-3 rounded-xl"
            : place === "right"
            ? "w-full md:w-[42%] md:float-right md:ml-4 mb-3 rounded-xl"
            : place === "top"
            ? "w-full max-h-72 object-cover rounded-xl mb-4"
            : place === "bottom"
            ? "w-full max-h-72 object-cover rounded-xl mt-4"
            : place === "split"
            ? "w-full md:w-[48%] inline-block md:mr-[2%] mb-3 rounded-xl align-top"
            : "w-2/3 mx-auto block rounded-xl my-4";
        return '<img alt="" src="' + src + '" class="' + cls + '" />';
      }
    )
    .replace(
      /\[(.*?)\]\((.*?)\)/gim,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-orange-300 underline">$1</a>'
    )
    .replace(/\n/g, "<br />");

  if (authLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-300">Checking account...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">Editors only</h1>
        <p className="text-gray-300 mb-6">
          You need a Ballpit account to write articles, upload media, and use AI tools.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-forge-accent text-white font-medium"
        >
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Write Article</h1>
        <p className="text-gray-300 text-sm">
          Account tools only. AI credits: <span className="text-white font-medium">{aiCredits}</span>
        </p>
        <p className="text-sm mt-2 text-green-300">Logged in as {loggedInName}</p>
        <p className="text-xs text-muted-pit mt-2">
          Write the story first. Submit for review. Tables, graphs, and AI images unlock from the
          three AI legs (truth, journalistic style, effort). Community stars are not in this gate.
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



          {pitStatus === "draft" && (
            <p className="text-xs text-muted-pit mb-4">
              Image placement, graphs, and AI generate stay locked until review passes.
            </p>
          )}

          {pitStatus === "tools" && review && (
            <div className="mb-4 p-4 rounded-2xl border border-white/10">
              <div className="text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: "#D4A056" }}>
                tools unlocked
              </div>
              <p className="text-sm mb-2">
                tBp AI legs · truth {review.truth} · journalistic {review.journalistic} · effort {review.effort} · avg {review.avg}
              </p>
              <div className="flex flex-wrap gap-2">
                {review.avg >= 55 && (
                  <button type="button" onClick={insertTable} className="px-3 py-1.5 rounded-lg bg-black/20 text-sm">
                    Insert table
                  </button>
                )}
                {review.avg >= 75 && (
                  <button type="button" onClick={insertGraph} className="px-3 py-1.5 rounded-lg bg-black/20 text-sm">
                    Insert graph
                  </button>
                )}
              </div>
            </div>
          )}

          {pitStatus === "tools" && review && review.avg >= 90 && (
          <>
          <div className="mb-4 p-4 rounded-2xl border border-forge-800 bg-forge-900">
            <div className="text-sm font-medium mb-2">Image placement</div>
            <p className="text-xs text-gray-400 mb-3">
              Applies to the next image you generate or insert, and to the thumbnail.
            </p>
            <div className="flex flex-wrap gap-2">
              {(["top", "middle", "bottom", "left", "right", "split"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setImagePlace(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                    imagePlace === p ? "bg-forge-accent text-white" : "bg-black/20"
                  }`}
                >
                  {p === "left" ? "left side" : p === "right" ? "right side" : p === "split" ? "split pair" : p}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 p-4 rounded-2xl border border-forge-800 bg-forge-900">
            <div className="text-sm font-medium mb-2">Images</div>
            <p className="text-xs text-gray-400 mb-3">
              Thumbnail is generated from the title and draft — no prompt. Prompt is only for inline images.
              Quality follows plan: Pit Pass none · Press standard · Desk high.
            </p>
            <div className="mb-4">
              <ComputeButton
                job="thumbnail"
                model={imgModel}
                label="Generate thumbnail from story"
                busy={generating}
                disabled={plan === "free"}
                onConfirm={handleGenerateThumbnailFromStory}
              />
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Prompt for an inline image only..."
              className="w-full min-h-[90px] bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm outline-none mb-3"
            />
            <ComputeButton
              job="image"
              model={imgModel}
              label="Generate inline image"
              busy={generating}
              disabled={plan === "free"}
              onConfirm={handleGenerateInline}
            />
            <p className="text-xs text-gray-400 mt-2">Failed reviews are not refunded. Uploads are off — AI only.</p>
          </div>
          </>
          )}

          {(uploading || uploadStatus) && (
            <p className="text-sm text-yellow-200 mb-3">
              {uploading ? "Uploading..." : uploadStatus}
            </p>
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
            placeholder="Write the story. Tools unlock after review."
            disabled={pitStatus === "foul" || pitStatus === "published"}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {pitStatus === "draft" && (
              <button
                onClick={handleReview}
                disabled={loading}
                className="px-6 py-2.5 bg-forge-accent text-white font-medium rounded-xl text-sm disabled:opacity-60"
              >
                {loading ? "Reviewing..." : "Submit for review"}
              </button>
            )}
            {pitStatus === "tools" && (
              <>
              <button
                onClick={handleThrowInPit}
                disabled={loading}
                className="px-6 py-2.5 bg-forge-accent text-white font-medium rounded-xl text-sm disabled:opacity-60"
              >
                {loading ? "Throwing..." : "Throw it in the pit?"}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 btn-metal"
              >
                Send to trashPit
              </button>
              </>
            )}
            {(pitStatus === "draft" || pitStatus === "foul") && articleId && (
              <button
                type="button"
                onClick={handleDiscard}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 btn-metal"
              >
                Send to trashPit
              </button>
            )}
          </div>

          {message && (
            <div className="mt-4 text-sm text-yellow-200">
              <p>{message}</p>
              {publishedId && (
                <Link href={`/article/${publishedId}`} className="inline-block mt-2 text-forge-accent">
                  {message.startsWith("Technical foul") ? "View desk copy →" : "View article →"}
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

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-gray-300">Loading editor...</p>
        </main>
      }
    >
      <EditorContent />
    </Suspense>
  );
}





