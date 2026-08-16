"use client";

import { useState } from "react";
import Link from "next/link";

export default function FanFictionPage() {
  const [step, setStep] = useState<"prompts" | "result">("prompts");
  const [generationsLeft, setGenerationsLeft] = useState(2);
  const [idea, setIdea] = useState("");

  const prompts = [
    "What if a star player accidentally time-traveled?",
    "A coach starts taking advice from a talking mascot",
    "The league is secretly run by rivalries from high school",
    "A rookie discovers the playbook is cursed",
    "Two franchises switch cities for one chaotic week",
  ];

  const handleGenerate = () => {
    if (generationsLeft <= 0) return;
    setGenerationsLeft((n) => n - 1);
    setStep("result");
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-block bg-purple-500/20 text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-md mb-3">
          Fan Fiction
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Write Fan Fiction</h1>
        <p className="text-gray-400 text-sm">
          Generate wild, funny, clearly untrue stories. Always labeled as Fan Fiction.
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

      {step === "prompts" && (
        <>
          {/* Prompt ideas */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-300 mb-3">Quick prompts</h2>
            <div className="flex flex-wrap gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setIdea(p)}
                  className="text-left text-sm px-3 py-2 rounded-xl bg-forge-900 border border-forge-800 hover:border-purple-500/50 hover:bg-forge-800 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom idea */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">
              Your idea (optional)
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe the ridiculous premise..."
              className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:border-purple-500 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generationsLeft <= 0}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition ${
                generationsLeft > 0
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
          {/* Generated result */}
          <div className="bg-forge-900 border border-purple-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded">
                Fan Fiction
              </span>
              <span className="text-xs text-gray-500">Clearly untrue · AI generated</span>
            </div>

            <h2 className="text-xl font-bold mb-3">
              Caleb Williams Accidentally Invents Time Travel During a Scramble
            </h2>

            <div className="text-sm text-gray-300 leading-relaxed space-y-3">
              <p>
                It started as a broken play. It ended with Walter Payton learning the RPO in 1985.
              </p>
              <p>
                According to sources that definitely do not exist, Williams scrambled left, stepped through what witnesses described as “a shimmering portal of pure chaos,” and landed on a practice field outside Chicago forty years earlier.
              </p>
              <p>
                Coaches at the time reportedly asked only one question: “Can he block?”
              </p>
              <p>
                The rest of the story involves a talking mascot, a cursed playbook, and one very confused time-traveling quarterback who just wanted a first down.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition">
              Publish Fan Fiction
            </button>
            <button
              onClick={() => setStep("prompts")}
              className="px-5 py-2.5 bg-forge-800 hover:bg-forge-700 text-sm rounded-xl transition"
            >
              Try another idea
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
