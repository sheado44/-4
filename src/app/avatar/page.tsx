"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Candidate = {
  id: number;
  url: string;
  prompt: string;
};

const MAX_ATTEMPTS = 3;

// Temporary image generator until your paid image AI is connected.
// Uses a deterministic seed so each attempt is different but repeatable.
function buildPreviewUrl(prompt: string, attempt: number) {
  const seed = `${prompt.trim().toLowerCase()}::attempt-${attempt}`;
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&size=256`;
}

export default function AvatarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentAvatar(profile?.avatar_url || "");
      setLoading(false);
    };
    boot();
  }, [router]);

  const attemptsLeft = MAX_ATTEMPTS - attemptsUsed;

  const generate = () => {
    setMessage("");
    const text = prompt.trim();
    if (!text) {
      setMessage("Describe how you look (or claim to look) first.");
      return;
    }
    if (attemptsLeft <= 0) {
      setMessage("You’ve used all 3 attempts. Choose one below or come back later.");
      return;
    }

    const nextAttempt = attemptsUsed + 1;
    const url = buildPreviewUrl(text, nextAttempt);
    const candidate: Candidate = {
      id: nextAttempt,
      url,
      prompt: text,
    };

    setCandidates((prev) => [...prev, candidate]);
    setSelectedId(candidate.id);
    setAttemptsUsed(nextAttempt);
    setMessage(`Attempt ${nextAttempt} of ${MAX_ATTEMPTS} ready. Pick one when you’re happy.`);
  };

  const saveSelected = async () => {
    if (!userId) return;
    const chosen = candidates.find((c) => c.id === selectedId);
    if (!chosen) {
      setMessage("Select one of the generated avatars first.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: chosen.url })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCurrentAvatar(chosen.url);
    setMessage("Avatar saved.");
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-pit">
        Loading avatar studio...
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--pit-text)" }}>
          Avatar studio
        </h1>
        <Link href="/profile" className="text-sm text-muted-pit hover:opacity-100">
          Back to profile
        </Link>
      </div>

      <div className="pit-panel p-5 mb-5">
        <p className="text-sm text-muted-pit mb-4">
          No photo uploads. Describe how you look (or claim to look). You get{" "}
          <strong style={{ color: "var(--pit-text)" }}>3 AI attempts</strong>, then choose one.
        </p>

        {currentAvatar ? (
          <div className="flex items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentAvatar}
              alt="Current avatar"
              className="w-16 h-16 rounded-full object-cover border border-white/10 bg-black/20"
            />
            <div className="text-sm text-muted-pit">Current avatar</div>
          </div>
        ) : null}

        <label className="text-xs text-muted-pit block mb-1">What do you look like?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full rounded-xl px-3 py-2 text-sm mb-3"
          placeholder="Example: mid-40s man, short brown hair, light stubble, baseball cap, friendly smile"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={attemptsLeft <= 0}
            className="btn-write px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            {attemptsLeft > 0 ? `Generate avatar (${attemptsLeft} left)` : "No attempts left"}
          </button>
          <span className="text-xs text-muted-pit">
            Attempts used: {attemptsUsed}/{MAX_ATTEMPTS}
          </span>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="pit-panel p-5 mb-5">
          <h2 className="font-semibold mb-3" style={{ color: "var(--pit-text)" }}>
            Your attempts — pick one
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {candidates.map((c) => {
              const active = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className="rounded-xl border p-3 text-left transition"
                  style={{
                    borderColor: active
                      ? "color-mix(in srgb, var(--pit-highlight) 60%, transparent)"
                      : "rgba(255,255,255,0.1)",
                    background: active
                      ? "color-mix(in srgb, var(--pit-highlight) 14%, transparent)"
                      : "rgba(0,0,0,0.18)",
                    boxShadow: active
                      ? "0 0 0 1px color-mix(in srgb, var(--pit-highlight) 35%, transparent)"
                      : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.url}
                    alt={`Attempt ${c.id}`}
                    className="w-full aspect-square rounded-lg object-cover mb-2 bg-black/20"
                  />
                  <div className="text-xs font-medium" style={{ color: "var(--pit-text)" }}>
                    Attempt {c.id}
                    {active ? " · selected" : ""}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={saveSelected}
            disabled={saving || selectedId == null}
            className="btn-write mt-4 px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Use selected avatar"}
          </button>
        </div>
      )}

      {message && <p className="text-sm text-yellow-500">{message}</p>}

      <p className="text-[11px] text-muted-pit mt-4">
        Preview avatars are temporary stand-ins until The Ballpit image AI is connected. The 3-try
        choose-one flow stays the same.
      </p>
    </main>
  );
}
