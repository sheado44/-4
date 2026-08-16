"use client";

import { useState } from "react";
import Link from "next/link";

const templates = [
  {
    id: 1,
    label: "Time-travel chaos",
    build: (v: Record<string, string>) =>
      `What if ${v.player || "____"} accidentally ${v.verb || "____"} a ${v.noun || "____"} during ${v.event || "____"}?`,
    fields: ["player", "verb", "noun", "event"],
    placeholders: {
      player: "player / person",
      verb: "verb",
      noun: "noun",
      event: "event",
    },
  },
  {
    id: 2,
    label: "Cursed object",
    build: (v: Record<string, string>) =>
      `The day ${v.player || "____"} found a cursed ${v.noun || "____"} and tried to ${v.verb || "____"} it at ${v.event || "____"}.`,
    fields: ["player", "noun", "verb", "event"],
    placeholders: {
      player: "player / person",
      noun: "object",
      verb: "verb",
      event: "event / place",
    },
  },
  {
    id: 3,
    label: "Secret league",
    build: (v: Record<string, string>) =>
      `Nobody knew the league was controlled by ${v.noun || "____"} until ${v.player || "____"} decided to ${v.verb || "____"} during ${v.event || "____"}.`,
    fields: ["noun", "player", "verb", "event"],
    placeholders: {
      noun: "secret group / thing",
      player: "player / person",
      verb: "verb",
      event: "event",
    },
  },
];

const tones = ["Funny", "Serious", "Mad", "Chaotic", "Deadpan"] as const;

export default function FanFictionPage() {
  const [step, setStep] = useState<"madlibs" | "result">("madlibs");
  const [generationsLeft, setGenerationsLeft] = useState(2);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [twist, setTwist] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("Funny");

  const template = templates[templateIndex];

  const handleRefresh = () => {
    setTemplateIndex((i) => (i + 1) % templates.length);
    setValues({});
    setTwist("");
  };

  const handleGenerate = () => {
    if (generationsLeft <= 0) return;
    setGenerationsLeft((n) => n - 1);
    setStep("result");
  };

  const filled = template.fields.every((f) => (values[f] || "").trim().length > 0);
  const title = `${values.player || "Someone"} and the ${values.noun || "Thing"}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-block bg-purple-500/20 text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-md mb-3">
          Fan Fiction
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Fan Fiction Mad Libs</h1>
        <p className="text-gray-400 text-sm">
          Fill in the blanks. Pick a tone. Generate something clearly untrue.
        </p>
      </div>

      {/* Daily limit */}
      <div className="mb-6 rounded-xl px-4 py-3 text-sm bg-forge-900 border border-forge-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          ✨ <span className="font-semibold text-white">{generationsLeft}</span> Fan Fiction generations left today
        </div>
        <div className="text-xs text-gray-500">
          Separate from your 1 AI image / day
        </div>
      </div>

      {step === "madlibs" && (
        <>
          {/* Tone */}
          <div className="mb-5">
            <div className="text-sm text-gray-300 mb-2">Writing tone</div>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3.5 py-1.5 rounded-full text-sm transition ${
                    tone === t
                      ? "bg-purple-600 text-white"
                      : "bg-forge-900 border border-forge-800 hover:border-purple-500/40 text-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Template card */}
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-gray-500">Setup: {template.label}</div>
              <button
                onClick={handleRefresh}
                className="text-xs px-3 py-1.5 rounded-lg bg-forge-800 hover:bg-forge-700 transition"
              >
                ↻ Refresh setup
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              {template.build(values)}
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {template.fields.map((field) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1 capitalize">
                    {field}
                  </label>
                  <input
                    value={values[field] || ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    placeholder={template.placeholders[field as keyof typeof template.placeholders]}
                    className="w-full bg-forge-800 border border-forge-700 rounded-xl px-3 py-2.5 text-sm focus:border-purple-500 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">
                Bonus twist
              </label>
              <input
                value={twist}
                onChange={(e) => setTwist(e.target.value)}
                placeholder="e.g. talking mascot, cursed playbook, rival from high school..."
                className="w-full bg-forge-800 border border-forge-700 rounded-xl px-3 py-2.5 text-sm focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generationsLeft <= 0 || !filled}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition ${
                generationsLeft > 0 && filled
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-forge-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              Generate Fan Fiction
            </button>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition">
              Cancel
            </Link>
          </div>
        </>
      )}

      {step === "result" && (
        <>
          <div className="bg-forge-900 border border-purple-500/30 rounded-2xl p-5 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded">
                Fan Fiction
              </span>
              <span className="bg-forge-800 text-gray-300 text-xs px-2 py-0.5 rounded">
                Tone: {tone}
              </span>
              <span className="text-xs text-gray-500">Clearly untrue · AI generated</span>
            </div>

            <h2 className="text-xl font-bold mb-3">{title}</h2>

            <div className="text-sm text-gray-300 leading-relaxed space-y-3">
              <p>{template.build(values)}</p>
              <p>
                Written in a <span className="text-purple-300">{tone.toLowerCase()}</span> tone.
                What happened next made almost no sense. According to extremely unreliable witnesses, everything only got stranger once {twist || "the bonus twist"} entered the picture.
              </p>
              <p>
                Coaches tried to explain it. Fans pretended they saw it coming. Nobody actually did. The only confirmed detail is that it was ridiculous, untrue, and somehow still entertaining.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition">
              Publish Fan Fiction
            </button>
            <button
              onClick={() => {
                setStep("madlibs");
                handleRefresh();
              }}
              className="px-5 py-2.5 bg-forge-800 hover:bg-forge-700 text-sm rounded-xl transition"
            >
              New setup
            </button>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition ml-auto">
              Cancel
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
