"use client";

import { useState } from "react";
import Link from "next/link";

export default function CommentPage() {
  const [imagesUsedToday, setImagesUsedToday] = useState(0);
  const canGenerateImage = imagesUsedToday < 1;

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
        <h1 className="text-2xl font-bold mb-1">Write a Comment</h1>
        <p className="text-gray-400 text-sm">
          Responding to: <span className="text-white">Why the Bears&apos; Offensive Line Is Quietly Elite in 2026</span>
        </p>
      </div>

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
      <div className="bg-forge-900 border border-forge-800 rounded-2xl overflow-hidden mb-6">
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
        </div>

        <div
          contentEditable
          suppressContentEditableWarning
          className="min-h-[280px] p-5 text-gray-200 leading-relaxed focus:outline-none"
        >
          <p className="text-gray-500">
            Write your comment here...
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="text-xs text-gray-500 mb-8 space-y-1">
        <p>• Free speech zone — any legal speech is welcome</p>
        <p>• AI images must be reasonably related to the discussion</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <button className="px-8 py-3 bg-forge-accent hover:bg-forge-accentHover text-white font-semibold rounded-xl transition">
          Post Comment
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
