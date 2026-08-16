"use client";

import { useState } from "react";
import Link from "next/link";

export default function FanFictionPage() {
  const [step, setStep] = useState<"madlibs" | "result">("madlibs");
  const [generationsLeft, setGenerationsLeft] = useState(2);

  const [player, setPlayer] = useState("");
  const [verb, setVerb] = useState("");
  const [noun, setNoun] = useState("");
  const [event, setEvent] = useState("");
  const [twist, setTwist] = useState("");

  const handleGenerate = () => {
    if (generationsLeft <= 0) return;
    setGenerationsLeft((n) => n - 1);
    setStep("result");
  };

  const filled =
    player.trim() && verb.trim() && noun.trim() && event.trim() && twist.trim();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-block bg-purple-500/20 text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-md mb-3">
          Fan Fiction
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Fan Fiction Mad Libs</h1>
        <p className="text-gray-400 text-sm">
          Fill in the blanks. Generate something ridiculous. Always clearly labeled untrue.
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
          {/* Mad Libs form */}
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 mb-6 space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              What if{" "}
              <input
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                placeholder="player / person"
                className="inline-block w-36 mx-1 bg-forge-800 border border-forge-700 rounded-lg px-2 py-1 text-sm focus:border-purple-500 outline-none"
              />{" "}
              accidentally{" "}
              <input
                value={verb}
                onChange={(e) => setVerb(e.target.value)}
                placeholder="verb"
                className="inline-block w-28 mx-1 bg-forge-800 border border-forge-700 rounded-lg px-2 py-1 text-sm focus:border-purple-500 outline-none"
              />{" "}
              a{" "}
              <input
                value={noun}
                onChange={(e) => setNoun(e.target.value)}
                placeholder="noun"
                className="inline-block w-28 mx-1 bg-forge-800 border border-forge-700 rounded-lg px-2 py-1 text-sm focus:border-purple-500 outline-none"
              />{" "}
              during{" "}
              <input
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="event"
                className="inline-block w-36 mx-1 bg-forge-800 border border-forge-700 rounded-lg px-2 py-1 text-sm focus:border-purple-500 outline-none"
              />
              ?
            </p>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Bonus twist (optional but better)
              </label>
              <input
                value={twist}
                onChange={(e) => setTwist(e.target.value)}
                placeholder="e.g. a talking mascot, cursed playbook, rival from high school..."
                className="w-full bg-forge-800 border border-forge-700 rounded-xl px-3 py-2.5 text-sm focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Example helpers */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2">Need ideas?</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  setPlayer("Caleb Williams");
                  setVerb("invented");
                  setNoun("time machine");
                  setEvent("a scramble");
                  setTwist("Walter Payton learns the RPO");
                }}
                className="px-3 py-1.5 rounded-lg bg-forge-900 border border-forge-800 hover:border-purple-500/40 transition"
              >
                Fill example
              </button>
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
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded">
                Fan Fiction
              </span>
              <span className="text-xs text-gray-500">Clearly untrue · AI generated</span>
            </div>

            <h2 className="text-xl font-bold mb-3">
              {player} Accidentally {verb} a {noun} During {event}
            </h2>

            <div className="text-sm text-gray-300 leading-relaxed space-y-3">
              <p>
                It started as a normal moment in {event}. It ended with {player} having {verb} a {noun} in front of thousands of confused fans.
              </p>
              <p>
                Witnesses (who absolutely do not exist) claim the whole thing only made sense once {twist} entered the picture.
              </p>
              <p>
                Coaches tried to diagram it. Broadcasters tried to explain it. Nobody succeeded. The only confirmed detail is that it was, somehow, both ridiculous and weirdly effective.
              </p>
              <p>
                And that is how {player} became the unlikely star of the most untrue story in sports this week.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition">
              Publish Fan Fiction
            </button>
            <button
              onClick={() => setStep("madlibs")}
              className="px-5 py-2.5 bg-forge-800 hover:bg-forge-700 text-sm rounded-xl transition"
            >
              Try another
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
