"use client";

import { useState } from "react";
import Link from "next/link";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [showReview, setShowReview] = useState(false);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Write Your Article</h1>
        <p className="text-forge-accent italic mb-1">
          “We don’t make sports fun. You do!”
        </p>
        <p className="text-gray-400 text-sm">
          Create something original. AI only checks quality and relevance — rankings come from readers.
        </p>
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
            <option>Sports – NFL</option>
            <option>Sports – NBA</option>
            <option>Sports – MLB</option>
            <option>Sports – Soccer / MLS</option>
            <option>Sports – College Football</option>
            <option>Sports – Other</option>
            <option>Pop Culture – Music</option>
            <option>Pop Culture – Film & TV</option>
            <option>Pop Culture – Other</option>
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
        <button className="px-3 py-1.5 rounded-lg bg-forge-accent/15 text-forge-accent hover:bg-forge-accent/25 text-sm transition">
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
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Thumbnail Image</h3>
            <p className="text-sm text-gray-400">
              This image appears on the homepage and in feeds. It must be reasonably related to your article.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm font-medium transition">
            📁 Upload from Computer
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-forge-accent hover:bg-forge-accentHover text-white rounded-xl text-sm font-medium transition">
            ✨ Generate with AI
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          AI will check that the image is relevant and doesn’t contain obvious copyrighted material.
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
        <div className="mt-8 bg-forge-900 border border-forge-700 rounded-2xl p-6 animate-in fade-in">
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
