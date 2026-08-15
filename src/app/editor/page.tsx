"use client";

import { useState } from "react";
import Link from "next/link";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [showReview, setShowReview] = useState(false);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Create Article</h1>
        <p className="text-forge-accent italic text-sm mb-1">
          “We don’t make sports fun. You do!”
        </p>
        <p className="text-gray-400 text-sm">
          Write your take. Add images. AI will only check quality and relevance before publishing.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a clear, specific title..."
            className="w-full bg-forge-900 border border-forge-700 rounded-lg px-4 py-2.5 focus:border-forge-accent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Section</label>
          <select className="w-full bg-forge-900 border border-forge-700 rounded-lg px-4 py-2.5 focus:border-forge-accent outline-none">
            <option>Sports – NFL</option>
            <option>Sports – NBA</option>
            <option>Sports – MLB</option>
            <option>Sports – Soccer</option>
            <option>Sports – College</option>
            <option>Pop Culture – Music</option>
            <option>Pop Culture – Film & TV</option>
            <option>Pop Culture – Other</option>
          </select>
        </div>
      </div>

      <div className="bg-forge-900 border border-forge-800 rounded-t-xl p-2 flex flex-wrap gap-1">
        <button type="button" className="px-3 py-1.5 rounded hover:bg-forge-700 text-sm font-bold">B</button>
        <button type="button" className="px-3 py-1.5 rounded hover:bg-forge-700 text-sm italic">I</button>
        <button type="button" className="px-3 py-1.5 rounded hover:bg-forge-700 text-sm">H2</button>
        <button type="button" className="px-3 py-1.5 rounded hover:bg-forge-700 text-sm">Link</button>
        <div className="w-px bg-forge-700 mx-1"></div>
        <button type="button" className="px-3 py-1.5 rounded hover:bg-forge-700 text-sm">Upload Image</button>
        <button type="button" className="px-3 py-1.5 rounded hover:bg-forge-700 text-sm text-forge-accent">AI Generate Image</button>
        <button type="button" className="px-3 py-1.5 rounded hover:bg-forge-700 text-sm">Stat Block</button>
      </div>

      <div
        contentEditable
        suppressContentEditableWarning
        className="bg-forge-900 border border-t-0 border-forge-800 rounded-b-xl min-h-[380px] p-6 text-gray-200 leading-relaxed focus:outline-none"
      >
        <p>Start writing your article here...</p>
        <p className="text-gray-500 mt-4">
          Use the toolbar above to format text or add images. You can upload your own photos or generate new ones with AI.
        </p>
      </div>

      <div className="mt-8 p-5 bg-forge-900 border border-forge-800 rounded-xl">
        <h3 className="font-semibold mb-2">Article Thumbnail</h3>
        <p className="text-sm text-gray-400 mb-4">
          Choose or generate a thumbnail. It must be reasonably related to your article. AI will check this.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-forge-800 hover:bg-forge-700 rounded-lg text-sm transition">
            Upload Thumbnail
          </button>
          <button className="px-4 py-2 bg-forge-accent/20 text-forge-accent hover:bg-forge-accent/30 rounded-lg text-sm transition">
            Generate with AI
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button className="px-5 py-2.5 text-sm bg-forge-800 hover:bg-forge-700 rounded-lg transition">
          Save Draft
        </button>
        <button
          onClick={() => setShowReview(true)}
          className="px-5 py-2.5 text-sm bg-forge-accent hover:bg-forge-accentHover rounded-lg font-medium transition"
        >
          Submit for Review
        </button>
        <Link href="/" className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition">
          Cancel
        </Link>
      </div>

      {showReview && (
        <div className="mt-8 bg-forge-900 border border-forge-700 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-3">AI Review Result</h3>
          <div className="space-y-2 text-sm mb-4">
            <p className="text-green-400">✓ Content quality check passed</p>
            <p className="text-green-400">✓ No major copyright issues detected</p>
            <p className="text-green-400">✓ Thumbnail appears relevant to the article</p>
          </div>
          <p className="text-green-400 font-medium mb-2">Ready to publish</p>
          <p className="text-sm text-gray-400 mb-4">
            Ranking will be based on reader engagement (views, comments, star ratings) — not AI scores.
          </p>
          <div className="flex gap-3">
            <button className="bg-forge-accent hover:bg-forge-accentHover px-5 py-2 rounded-lg text-sm font-medium transition">
              Publish Now
            </button>
            <button
              onClick={() => setShowReview(false)}
              className="bg-forge-800 hover:bg-forge-700 px-5 py-2 rounded-lg text-sm transition"
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
