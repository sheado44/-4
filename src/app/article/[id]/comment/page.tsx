"use client";

import { useState } from "react";
import Link from "next/link";

export default function CommentPage() {
  const [imagesUsedToday, setImagesUsedToday] = useState(0);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const canGenerateImage = imagesUsedToday < 1;

  const isReply = true;
  const replyingTo = {
    name: "Derek K.",
    text: "Finally someone posting the actual film grades instead of the same old “Bears line is bad” narrative. The right tackle improvement alone is massive.",
  };

  const sampleGifs = [
    { id: 1, label: "Mind blown", emoji: "🤯" },
    { id: 2, label: "Fire", emoji: "🔥" },
    { id: 3, label: "Clapping", emoji: "👏" },
    { id: 4, label: "Disagree", emoji: "😤" },
    { id: 5, label: "Laughing", emoji: "😂" },
    { id: 6, label: "Thinking", emoji: "🤔" },
  ];

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/article/1"
          className="text-sm text-gray-400 hover:text-forge-accent transition mb-4 inline-block"
        >
          ← Back to article
        </Link>
        <h1 className="text-2xl font-bold mb-1">
          {isReply ? "Write a Reply" : "Write a Comment"}
        </h1>
        <p className="text-sm text-gray-400">
          On: <span className="text-white">Why the Bears&apos; Offensive Line Is Quietly Elite in 2026</span>
        </p>
      </div>

      {/* Replying to */}
      {isReply && (
        <div className="mb-6 bg-forge-900/60 border border-forge-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Replying to {replyingTo.name}</div>
          <p className="text-sm text-gray-300 line-clamp-2">
            “{replyingTo.text}”
          </p>
        </div>
      )}

      {/* AI Image Limit */}
      <div
        className={`mb-5 rounded-xl px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          canGenerateImage
            ? "bg-forge-900 border border-forge-800 text-gray-300"
            : "bg-red-500/10 border border-red-500/30 text-red-300"
        }`}
      >
        <div>
          {canGenerateImage ? (
            <>
              ✨ <span className="font-semibold text-white">1 AI image</span> remaining today
            </>
          ) : (
            <>Daily AI image used</>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Shared across articles & comments
        </div>
      </div>

      {/* Editor */}
      <div className="bg-forge-900 border border-forge-800 rounded-2xl overflow-hidden mb-4">
        <div className="px-3 py-2 border-b border-forge-800 flex flex-wrap gap-1">
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm font-bold transition">B</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm italic transition">I</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm transition">Link</button>
          <div className="w-px h-5 bg-forge-700 mx-1 self-center" />
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm transition">
            📷 Upload
          </button>
          <button
            disabled={!canGenerateImage}
            onClick={() => canGenerateImage && setImagesUsedToday(1)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              canGenerateImage
                ? "text-forge-accent hover:bg-forge-accent/10"
                : "text-gray-600 cursor-not-allowed"
            }`}
          >
            ✨ AI Image
          </button>
          <button
            onClick={() => setShowGifPanel(!showGifPanel)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              showGifPanel ? "bg-forge-800 text-white" : "hover:bg-forge-800"
            }`}
          >
            GIF
          </button>
        </div>

        <div
          contentEditable
          suppressContentEditableWarning
          className="min-h-[220px] p-5 text-gray-200 leading-relaxed focus:outline-none text-sm"
        >
          <p className="text-gray-500">
            {isReply ? "Write your reply..." : "Write your comment..."}
          </p>
        </div>
      </div>

      {/* GIF Panel */}
      {showGifPanel && (
        <div className="mb-5 bg-forge-900 border border-forge-800 rounded-2xl p-4">
          <input
            type="text"
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-forge-800 border border-forge-700 rounded-xl px-4 py-2.5 text-sm focus:border-forge-accent outline-none mb-3"
          />
          <div className="grid grid-cols-3 gap-2">
            {sampleGifs.map((gif) => (
              <button
                key={gif.id}
                className="aspect-square bg-forge-800 hover:bg-forge-700 rounded-xl flex flex-col items-center justify-center gap-1 transition border border-forge-700 hover:border-forge-accent"
              >
                <span className="text-2xl">{gif.emoji}</span>
                <span className="text-[10px] text-gray-400">{gif.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-6">
        All images and GIFs must be reasonably related to the discussion.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="px-6 py-2.5 bg-forge-accent hover:bg-forge-accentHover text-white font-medium rounded-xl transition text-sm">
          {isReply ? "Post Reply" : "Post Comment"}
        </button>
        <Link
          href="/article/1"
          className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition"
        >
          Cancel
        </Link>
      </div>
    </main>
  );
}
