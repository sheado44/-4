"use client";

import { useState } from "react";
import Link from "next/link";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [imagesUsedToday, setImagesUsedToday] = useState(0); // 0 = available, 1 = used

  const canGenerateImage = imagesUsedToday < 1;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Write Your Article</h1>
        <p className="text-gray-400 text-sm">
          Create something original. AI only checks quality and relevance — rankings come from readers.
        </p>
      </div>

      {/* Daily AI Image Limit Banner */}
      <div className={`mb-6 rounded-xl px-4 py-3 text-sm flex items-center justify-between ${
        canGenerateImage 
          ? "bg-forge-900 border border-forge-700 text-gray-300" 
          : "bg-red-500/10 border border-red-500/30 text-red-300"
      }`}>
        <div>
          {canGenerateImage ? (
            <>✨ You have <span className="font-semibold text-white">1 AI image</span> remaining today</>
          ) : (
            <>You’ve used your AI image for today. Resets at midnight.</>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Can be used for article, thumbnail, or comments
        </div>
      </div>

      {/* Title & Section */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your article a strong, clear title..."
            className="w-full bg-forge-900 border border-forge-700 rounded-xl px-4 py-3 focus:border-forge-accent focus:ring-1 focus:ring-forge-accent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Section
          </label>
          <select className="w-full bg-forge-900 border border-forge-700 rounded-xl px-4 py-3 focus:border-forge-accent outline-none">
            <option>Sports</option>
            <option>Pop Culture</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-forge-900 border border-forge-800 rounded-t-xl px-3 py-2 flex flex-wrap items-center gap-1">
        <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm font-bold transition">B</button>
        <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm italic transition">I</button>
        <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm transition">H2</button>
        <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm transition">Link</button>
        <div className="w-px h-5 bg-forge-700 mx-1"></div>
        <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm transition">
          📷 Upload Image
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
          ✨ AI Generate Image
        </button>
        <button className="px-3 py-1.5 rounded-lg hover:bg-forge-700 text-sm transition">
          📊 Stat Block
        </button>
      </div>

      {/* Writing Area */}
      <div
        contentEditable
        suppressContentEditableWarning
        className="bg-forge-900 border border-t-0 border-forge-800 rounded-b-xl min-h-[420px] p-6 text-gray-200 leading-relaxed focus:outline-none"
      >
        <p className="text-gray-500">
          Start writing here. Tell the story, make your case, or share the take only you can write...
        </p>
      </div>

      {/* Thumbnail Section */}
      <div className="mt-8 bg-forge-900 border border-forge-800 rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-1">Thumbnail Image</h3>
          <p className="text-sm text-gray-400">
            This image appears on the homepage and in feeds. It must be reasonably related to your article.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm font-medium transition">
            📁 Upload from Computer
          </button>
          <button 
            disabled={!canGenerateImage}
            onClick={() => canGenerateImage && setImagesUsedToday(1)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
              canGenerateImage 
                ? "bg-forge-accent hover:bg-forge-accentHover text-white" 
                : "bg-forge-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            ✨ Generate with AI
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          AI will check that the image is relevant and doesn’t contain obvious copyrighted material.
          {canGenerateImage ? " Using AI here will use your 1 daily image." : " You’ve already used your daily AI image."}
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          onClick={() => setShowReview(true)}
          className="px-8 py-3 bg-forge-accent hover:bg-forge-accentHover text-white font-semibold rounded-xl transition shadow-lg shadow-orange-500/20"
        >
          Submit for Review
        </button>
        <button className="px-6 py-3 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm font-medium transition">
          Save Draft
        </button>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition ml-auto">
          Cancel
        </Link>
      </div>

      {/* AI Review Panel */}
      {showReview && (
        <div className="mt-8 bg-forge-900 border border-forge-700 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Review Results</h3>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 text-lg">✓</span>
              <span>Content quality and originality look good</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 text-lg">✓</span>
              <span>No major copyright concerns detected</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 text-lg">✓</span>
              <span>Thumbnail appears relevant to the article</span>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-5">
            <p className="text-green-400 font-medium">Ready to publish</p>
            <p className="text-sm text-gray-400 mt-1">
              Once published, ranking will be driven by real reader engagement (views, comments, and star ratings).
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-forge-accent hover:bg-forge-accentHover text-white font-medium rounded-xl transition">
              Publish Now
            </button>
            <button
              onClick={() => setShowReview(false)}
              className="px-6 py-2.5 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm transition"
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
