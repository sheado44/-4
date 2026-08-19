"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { spendAiCredits } from "@/lib/aiCredits";
import ComputeButton from "@/components/ComputeButton";

type Kind = "article" | "comment";

const COST: Record<Kind, number> = {
  comment: 1,
  article: 2,
};

function stubResearch(text: string, kind: Kind) {
  const clean = text.replace(/\s+/g, " ").trim();
  const words = clean ? clean.split(" ").length : 0;
  const clip = clean.slice(0, 220);
  const names = Array.from(clean.matchAll(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g)).map((m) => m[0]);
  const nums = clean.match(/\b\d+(?:\.\d+)?%?\b/g) || [];

  return [
    `Research this ${kind} · ${words} words`,
    clip ? `"${clip}${clean.length > 220 ? "…" : ""}"` : "(empty take)",
    "",
    names.length
      ? `Named: ${[...new Set(names)].slice(0, 6).join(", ")}`
      : "No proper names jumped out. That can mean a vibe piece, or it is hiding the who.",
    nums.length
      ? `Numbers on the page: ${nums.slice(0, 8).join(", ")}. Those are the first things to verify.`
      : "No hard numbers. Treat big claims as unproven until a source shows up.",
    "",
    "What holds: the tone is clear enough to argue with. That is the point of a take.",
    "What is thin: no cited source in this stub pass. Live research will hit a model + web later.",
    "What to check next: the other side of the same names, and whether the number is a rate or a count.",
    "",
    "This writeup is the paid layer. Reading the take stays free.",
  ].join("\n");
}

export default function ResearchTake({
  text,
  kind,
}: {
  text: string;
  kind: Kind;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [out, setOut] = useState("");

  const cost = COST[kind];

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("ai_credits")
        .eq("id", user.id)
        .maybeSingle();
      setCredits(Number(profile?.ai_credits ?? 0));
    };
    boot();
  }, []);

  const run = async () => {
    setMessage("");
    if (!userId) {
      setMessage("Log in to research a take.");
      return;
    }
    const body = (text || "").trim();
    if (body.length < 8) {
      setMessage("Nothing to research yet.");
      return;
    }
    if (credits < cost) {
      setMessage(`Need ${cost} credit${cost === 1 ? "" : "s"}. Open theMoneyPit.`);
      return;
    }
    setBusy(true);
    const spend = await spendAiCredits(cost, `research-${kind}`);
    if (!spend.ok) {
      setMessage(spend.reason);
      setBusy(false);
      return;
    }
    setCredits(spend.remaining);
    setOut(stubResearch(body, kind));
    setBusy(false);
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
  };

  if (!userId) {
    return (
      <div className="mt-3">
        <Link href="/login" className="text-xs text-highlight-pit">
          Log in to research this take
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <ComputeButton
        cost={cost}
        label="Research this take"
        busy={busy}
        onConfirm={run}
      />
      {message && <p className="text-xs text-yellow-500 mt-2">{message}</p>}
      {out && (
        <pre className="mt-3 text-sm whitespace-pre-wrap font-sans leading-relaxed pit-panel p-3">
          {out}
        </pre>
      )}
    </div>
  );
}

