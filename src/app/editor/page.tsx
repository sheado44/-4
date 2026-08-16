"use client";

import { useState } from "react";
import Link from "next/link";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [imagesUsedToday, setImagesUsedToday] = useState(0);
  const canGenerateImage = imagesUsedToday < 1;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Write Article</h1>
        <p className="text-gray-400 text-sm">
          AI only checks quality and relevance. Rankings come from readers.
        </p>
      </div>

      {/* Daily AI Image Limit */}
      <div
        className={`mb-6 rounded-xl px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          canGenerateImage
            ? "bg-forge-900 border border-forge-800 text-gray-300"
            : "bg-red-500/10 border border-red-500/30 text-red-300"
        }`}
      >
        <div>
          {canGenerateImage ? (
            <>
              ✨ You have <span className="font-semibold text-white">1 AI image</span> remaining today
            </>
          ) : (
            <>You’ve used your AI image for today</>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Shared across articles, thumbnails & comments
        </div>
      </div>

      {/* Title & Section */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Strong, clear title..."
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Section</label>
          <select className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none">
            <option>Sports</option>
            <option>Pop Culture</option>
          </select>
        </div>
      </div>

      {/* Toolbar + Editor */}
      <div className="bg-forge-900 border border-forge-800 rounded-2xl overflow-hidden mb-6">
        <div className="px-3 py-2 border-b border-forge-800 flex flex-wrap gap-1">
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm font-bold transition">B</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm italic transition">I</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm transition">H2</button>
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
          <button className="px-3 py-1.5 rounded-lg hover:bg-forge-800 text-sm transition">
            📊 Stat Block
          </button>
        </div>

        <div
          contentEditable
          suppressContentEditableWarning
          className="min-h-[360px] p-5 text-gray-200 leading-relaxed focus:outline-none text-sm"
        >
          <p className="text-gray-500">
            Start writing your article here...
          </p>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 mb-8">
        <h3 className="font-semibold mb-1">Thumbnail</h3>
        <p className="text-sm text-gray-400 mb-4">
          Appears on the homepage and feeds. Must be reasonably related to the article.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm transition">
            📁 Upload
          </button>
          <button
            disabled={!canGenerateImage}
            onClick={() => canGenerateImage && setImagesUsedToday(1)}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              canGenerateImage
                ? "bg-forge-accent hover:bg-forge-accentHover text-white"
                : "bg-forge-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            ✨ Generate with AI
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          All images (uploaded or AI) must be relevant to the content.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowReview(true)}
          className="px-6 py-2.5 bg-forge-accent hover:bg-forge-accentHover text-white font-medium rounded-xl transition text-sm"
        >
          Submit for Review
        </button>
        <button className="px-5 py-2.5 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm transition">
          Save Draft
        </button>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition ml-auto">
          Cancel
        </Link>
      </div>

      {/* Review Panel */}
      {showReview && (
        <div className="mt-8 bg-forge-900 border border-forge-800 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Review Results</h3>

          <div className="space-y-2.5 mb-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Content quality and originality look good</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>No major copyright concerns detected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Thumbnail appears relevant</span>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-5">
            <p className="text-green-400 font-medium text-sm">Ready to publish</p>
            <p className="text-xs text-gray-400 mt-1">
              Ranking will be driven by views, comments, and star ratings.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-2 bg-forge-accent hover:bg-forge-accentHover text-white text-sm font-medium rounded-xl transition">
              Publish Now
            </button>
            <button
              onClick={() => setShowReview(false)}
              className="px-5 py-2 bg-forge-800 hover:bg-forge-700 text-sm rounded-xl transition"
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
