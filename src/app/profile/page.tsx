"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"articles" | "comments" | "satire">("articles");

  const articles = [
    {
      id: "1",
      rankLabel: "#1 Ranked",
      category: "NFL",
      stars: 4.8,
      date: "Aug 12, 2026",
      title: "Why the Bears' Offensive Line Is Quietly Elite in 2026",
      meta: "12.4k views • 48 comments",
    },
    {
      id: "2",
      rankLabel: "#8",
      category: "NFL",
      stars: 4.5,
      date: "Jul 28, 2026",
      title: "The Evolution of Zone Blocking in the Modern NFL",
      meta: "6.2k views • 22 comments",
    },
  ];

  const comments = [
    {
      article: "Why the Bears' Offensive Line Is Quietly Elite in 2026",
      time: "2h ago",
      text: "Finally someone posting the actual film grades instead of the same old narrative. The right tackle improvement alone is massive.",
      likes: 24,
      dislikes: 3,
    },
    {
      article: "The Quiet Revolution in NBA Load Management",
      time: "1d ago",
      text: "The biometric data angle is underrated. Most people still think load management is just resting stars.",
      likes: 17,
      dislikes: 2,
    },
  ];

  const satire = [
    {
      id: "5",
      title: "Caleb Williams Accidentally Invents Time Travel During a Scramble",
      stars: 4.9,
      date: "Aug 10, 2026",
      meta: "6.3k views • 91 comments",
    },
    {
      id: "6",
      title: "The Day the Mascot Took Over Play-Calling",
      stars: 4.6,
      date: "Jul 22, 2026",
      meta: "3.1k views • 44 comments",
    },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold shrink-0">
          JR
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">Jordan Reyes</h1>
          <p className="text-gray-400 mb-4">
            NFL & college football analyst • Chicago
          </p>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-400">Publisher Rank</div>
              <div className="font-bold text-forge-accent text-lg">#7</div>
            </div>
            <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-400">Commenter Rank</div>
              <div className="font-bold text-white text-lg">#22</div>
            </div>
            <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-400">Heat</div>
              <div className="font-bold text-orange-400 text-lg">Hot</div>
            </div>
          </div>

          <p className="text-gray-300 max-w-2xl text-sm leading-relaxed">
            Former D-II offensive lineman turned film and data nerd. I write about the trenches, scheme evolution, and the numbers that actually matter.
          </p>
        </div>
      </div>

      <Link
        href="/relationship"
        className="block mb-8 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 hover:bg-green-500/15 transition"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Your relationship (only visible to you)</div>
            <div className="font-semibold text-green-400">Ally</div>
          </div>
          <div className="text-sm text-gray-400">
            14 likes · 2 dislikes · 5 comments · 3 replies →
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{articles.length}</div>
          <div className="text-xs text-gray-400 mt-1">Articles</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">84k</div>
          <div className="text-xs text-gray-400 mt-1">Article Views</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{comments.length}</div>
          <div className="text-xs text-gray-400 mt-1">Comments</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">1,240</div>
          <div className="text-xs text-gray-400 mt-1">Likes Received</div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-forge-800 mb-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab("articles")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "articles"
              ? "border-b-2 border-forge-accent text-forge-accent"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Articles
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "comments"
              ? "border-b-2 border-forge-accent text-forge-accent"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setActiveTab("satire")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "satire"
              ? "border-b-2 border-purple-400 text-purple-300"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Satire
        </button>
      </div>

      {activeTab === "articles" && (
        articles.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
            <p className="text-gray-300 font-medium mb-1">No articles yet</p>
            <p className="text-sm text-gray-500 mb-4">When this user publishes, their articles will show up here.</p>
            <Link href="/editor" className="text-sm text-forge-accent hover:text-orange-300 transition">
              Write an article →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/article/${a.id}`}
                className="block bg-forge-900 border border-forge-800 rounded-xl p-5 hover:border-forge-700 transition"
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span className="text-forge-accent font-medium">{a.rankLabel}</span>
                  <span>•</span>
                  <span>{a.category}</span>
                  <span>•</span>
                  <span className="text-yellow-500">★ {a.stars}</span>
                  <span>•</span>
                  <span>{a.date}</span>
                </div>
                <h2 className="text-lg font-bold mb-1">{a.title}</h2>
                <p className="text-gray-400 text-sm">{a.meta}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "comments" && (
        comments.length === 0 ? (
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
            <p className="text-gray-300 font-medium mb-1">No comments yet</p>
            <p className="text-sm text-gray-500">Comments this user leaves will appear here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {comments.map((c, i) => (
              <div key={i} className="bg-forge-900 border border-forge-800 rounded-xl p-5">
                <div className="text-xs text-gray-500 mb-2">
                  On <span className="text-gray-300">{c.article}</span> · {c.time}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">{c.text}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>👍 {c.likes}</span>
                  <span>👎 {c.dislikes}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === "satire" && (
        satire.length === 0 ? (
          <div className="bg-forge-900 border border-purple-500/20 rounded-2xl p-10 text-center">
            <p className="text-gray-300 font-medium mb-1">No satire yet</p>
            <p className="text-sm text-gray-500 mb-4">Clearly untrue, entertainment-only pieces will show up here.</p>
            <Link href="/fan-fiction" className="text-sm text-purple-300 hover:text-purple-200 transition">
              Write Satire →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {satire.map((s) => (
              <Link
                key={s.id}
                href={`/article/${s.id}`}
                className="block bg-forge-900 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition"
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-medium">
                    Satire
                  </span>
                  <span>•</span>
                  <span className="text-yellow-500">★ {s.stars}</span>
                  <span>•</span>
                  <span>{s.date}</span>
                </div>
                <h2 className="text-lg font-bold mb-1">{s.title}</h2>
                <p className="text-gray-400 text-sm">{s.meta}</p>
              </Link>
            ))}
          </div>
        )
      )}
    </main>
  );
}
