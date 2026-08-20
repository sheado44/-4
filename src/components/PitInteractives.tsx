"use client";

import { useEffect, useMemo, useState } from "react";

type Block =
  | { type: "text"; text: string }
  | { type: "poll"; q: string; opts: string[] }
  | { type: "flip"; front: string; back: string }
  | { type: "ba"; before: string; after: string }
  | { type: "img"; src: string; place: string };

function imgClass(place: string) {
  switch (place) {
    case "left":
      return "w-full md:w-[42%] md:float-left md:mr-4 mb-4 rounded-xl";
    case "right":
      return "w-full md:w-[42%] md:float-right md:ml-4 mb-4 rounded-xl";
    case "top":
      return "w-full max-h-80 object-cover rounded-xl mb-6";
    case "bottom":
      return "w-full max-h-80 object-cover rounded-xl mt-6 mb-4";
    case "split":
      return "w-full md:w-[48%] inline-block md:mr-[2%] mb-4 rounded-xl align-top";
    default:
      return "w-full md:w-2/3 mx-auto block rounded-xl my-6";
  }
}

function splitPit(raw: string): Block[] {
  const out: Block[] = [];
  const re = /:::(poll|flip|ba)\n([\s\S]*?)\n:::/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (m.index > last) pushText(out, raw.slice(last, m.index));
    const kind = m[1];
    const inner = m[2].trim();
    if (kind === "poll") {
      const lines = inner.split("\n").map((l) => l.trim()).filter(Boolean);
      out.push({ type: "poll", q: lines[0] || "Poll", opts: lines.slice(1, 5) });
    } else if (kind === "flip") {
      const [front, back] = inner.split(/\n---\n/).map((s) => s.trim());
      out.push({ type: "flip", front: front || "Front", back: back || "Back" });
    } else {
      const [before, after] = inner.split("\n").map((s) => s.trim());
      out.push({
        type: "ba",
        before: before || "",
        after: after || "",
      });
    }
    last = m.index + m[0].length;
  }
  if (last < raw.length) pushText(out, raw.slice(last));
  return out.length ? out : [{ type: "text", text: raw }];
}

function pushText(out: Block[], chunk: string) {
  chunk.split("\n").forEach((line) => {
    const img = line.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
    if (img) {
      const place = (img[1].match(/img:(\w+)/) || [])[1] || "middle";
      out.push({ type: "img", src: img[2], place });
      return;
    }
    out.push({ type: "text", text: line });
  });
}

function PollBlock({ q, opts }: { q: string; opts: string[] }) {
  const key = "pit-poll-" + q.slice(0, 80);
  const [pick, setPick] = useState<string | null>(null);
  const [tally, setTally] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setPick(saved);
      const t = localStorage.getItem(key + "-tally");
      if (t) setTally(JSON.parse(t));
    } catch {
      // ignore
    }
  }, [key]);

  const vote = (opt: string) => {
    if (pick) return;
    const next = { ...tally, [opt]: (tally[opt] || 0) + 1 };
    setPick(opt);
    setTally(next);
    try {
      localStorage.setItem(key, opt);
      localStorage.setItem(key + "-tally", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const total = Object.values(tally).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="pit-panel p-4 my-5 clear-both">
      <div className="text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: "#D4A056" }}>
        poll · 0 credits
      </div>
      <p className="font-semibold mb-3">{q}</p>
      <div className="space-y-2">
        {opts.map((opt) => {
          const n = tally[opt] || 0;
          const pct = pick ? Math.round((n / total) * 100) : 0;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => vote(opt)}
              className="w-full text-left rounded-lg px-3 py-2 text-sm relative overflow-hidden"
              style={{
                border: pick === opt ? "1px solid #D4A056" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {pick && (
                <span
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${pct}%`,
                    background: "rgba(212,160,86,0.22)",
                  }}
                />
              )}
              <span className="relative">{opt}{pick ? ` · ${pct}%` : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlipBlock({ front, back }: { front: string; back: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="w-full my-5 clear-both text-left"
      style={{ perspective: 900 }}
    >
      <div
        className="pit-panel p-5 min-h-[120px] transition-transform"
        style={{
          transform: on ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          transition: "transform 0.45s",
        }}
      >
        <div style={{ backfaceVisibility: "hidden" }}>
          <div className="text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: "#D4A056" }}>
            flip · tap
          </div>
          <p className="text-sm leading-relaxed">{front}</p>
        </div>
        <div
          className="absolute inset-0 p-5"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: "#F4F7FB" }}>
            flip · back
          </div>
          <p className="text-sm leading-relaxed">{back}</p>
        </div>
      </div>
    </button>
  );
}

function BaBlock({ before, after }: { before: string; after: string }) {
  const [pct, setPct] = useState(50);
  return (
    <div className="my-5 clear-both">
      <div className="text-[10px] uppercase tracking-[0.16em] mb-2" style={{ color: "#D4A056" }}>
        before / after · drag
      </div>
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5"
          style={{ left: `${pct}%`, background: "#D4A056" }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
        className="w-full mt-2"
      />
    </div>
  );
}

export default function PitBody({ body }: { body: string }) {
  const blocks = useMemo(() => splitPit(body || ""), [body]);
  return (
    <article className="max-w-none mb-10 overflow-hidden">
      {blocks.map((b, i) => {
        if (b.type === "poll") return <PollBlock key={i} q={b.q} opts={b.opts} />;
        if (b.type === "flip") return <FlipBlock key={i} front={b.front} back={b.back} />;
        if (b.type === "ba") return <BaBlock key={i} before={b.before} after={b.after} />;
        if (b.type === "img") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={b.src} alt="" className={imgClass(b.place)} />
          );
        }
        if (!b.text.trim()) return null;
        return (
          <p key={i} className="text-gray-100 leading-relaxed mb-5">
            {b.text}
          </p>
        );
      })}
      <div className="clear-both" />
    </article>
  );
}

export const POLL_STUB = `:::poll
Who takes this one?
Home side
Road side
Toss-up
:::`;

export const FLIP_STUB = `:::flip
The take everyone is repeating.
---
The part nobody wants to say out loud.
:::`;

export const BA_STUB = `:::ba
https://placehold.co/960x540/252729/F4F7FB/png?text=before
https://placehold.co/960x540/1E2022/D4A056/png?text=after
:::`;

