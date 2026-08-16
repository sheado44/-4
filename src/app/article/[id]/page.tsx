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

  // Prototype GIF results
  const sampleGifs = [
    { id: 1, label: "Mind blown", emoji: "🤯" },
    { id: 2, label: "This is fine", emoji: "🔥" },
    { id: 3, label: "Clapping", emoji: "👏" },
    { id: 4, label: "Disagree", emoji: "😤" },
    { id: 5, label: "Laughing", emoji: "😂" },
    { id: 6, label: "Thinking", emoji: "🤔" },
  ];

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/article/1" 
          className="text-sm text-gray-400 hover:text-forge-accent transition mb-4 inline-block"
        >
          ← Back to article
        </Link>
        <h1 className="text-2xl font-bold mb-1">
          {isReply ? "Write a Reply" : "Write a Comment"}
        </h1>
        <p className="text-gray-400 text-sm">
          On: <span className="text-white">Why the Bears&apos; Offensive Line Is Quietly Elite in 2026</span>
        </p>
      </div>

      {/* Replying to preview */}
      {isReply && (
        <div className="mb-6 bg-forge-900/70 border border-forge-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Replying to {replyingTo.name}</div>
          <p className="text-sm text-gray-300 line-clamp-3">
            “{replyingTo.text}”
          </p>
        </div>
      )}

      {/* Daily AI Image Limit */}
      <div className={`mb-6 rounded-xl px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
        canGenerateImage 
          ? "bg-forge-900 border border-forge-700 text-gray-300" 
          : "bg-red-500/10 border border-red-500/30 text-red-300"
      }`}>
        <div>
          {canGenerateImage ? (
            <>✨ You have <span className="font-semibold text-white">1 AI image</span> remaining today</>
          ) : (
            <>You’ve used your AI image for today</>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Shared across articles, thumbnails & comments
        </div>
      </div>

      {/* Writing Area */}
      <div className="bg-forge-900 border border-forge-800 rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-forge-800 flex flex-wrap gap-2">
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm font-bold transition">B</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm italic transition">I</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm transition">Link</button>
          <div className="w-px h-5 bg-forge-700 mx-1"></div>
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm transition">
            📷 Upload
          </button>
          <button
            disabled={!canGenerateImage}
            onClick={() => canGenerateImage && setImagesUsedToday(1)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              canGenerateImage
                ? "bg-forge-accent/15 text-forge-accent hover:bg-forge-accent/25"
                : "text-gray-600 cursor-not-allowed"
            }`}
          >
            ✨ AI Image
          </button>
          <button
            onClick={() => setShowGifPanel(!showGifPanel)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              showGifPanel ? "bg-forge-700 text-white" : "hover:bg-forge-700"
            }`}
          >
            GIF
          </button>
        </div>

        <div
          contentEditable
          suppressContentEditableWarning
          className="min-h-[240px] p-5 text-gray-200 leading-relaxed focus:outline-none"
        >
          <p className="text-gray-500">
            {isReply ? "Write your reply here..." : "Write your comment here..."}
          </p>
        </div>
      </div>

      {/* GIF Search Panel */}
      {showGifPanel && (
        <div className="mb-6 bg-forge-900 border border-forge-800 rounded-2xl p-4">
          <input
            type="text"
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-forge-800 border border-forge-700 rounded-xl px-4 py-2.5 text-sm focus:border-forge-accent outline-none mb-4"
          />

          <div className="grid grid-cols-3 gap-3">
            {sampleGifs.map((gif) => (
              <button
                key={gif.id}
                className="aspect-square bg-forge-800 hover:bg-forge-700 rounded-xl flex flex-col items-center justify-center gap-1 transition border border-forge-700 hover:border-forge-accent"
              >
                <span className="text-3xl">{gif.emoji}</span>
                <span className="text-xs text-gray-400">{gif.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Prototype – real GIF search (Giphy/Tenor) will be connected later.
          </p>
        </div>
      )}

      {/* Image rule */}
      <div className="text-xs text-gray-500 mb-8">
        All images and GIFs (uploaded or AI-generated) must be reasonably related to the discussion.
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <button className="px-8 py-3 bg-forge-accent hover:bg-forge-accentHover text-white font-semibold rounded-xl transition">
          {isReply ? "Post Reply" : "Post Comment"}
        </button>
        <Link 
          href="/article/1" 
          className="px-6 py-3 text-sm text-gray-400 hover:text-white transition"
        >
          Cancel
        </Link>
      </div>
    </main>
  );
}
