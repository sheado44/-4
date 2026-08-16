"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProfileUser = {
  id: string;
  email?: string;
  displayName: string;
  initials: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"articles" | "comments" | "satire">("articles");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const displayName =
        authUser.user_metadata?.display_name ||
        authUser.email?.split("@")[0] ||
        "User";

      const initials = displayName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      setUser({
        id: authUser.id,
        email: authUser.email,
        displayName,
        initials,
      });
      setLoading(false);
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-gray-400">Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-3">You’re not logged in</h1>
        <p className="text-gray-400 mb-6">Log in to see your profile.</p>
        <Link
          href="/login"
          className="inline-block bg-forge-accent hover:bg-forge-accentHover text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
        >
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Big profile header */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-blue-600 flex items-center justify-center text-5xl md:text-6xl font-bold mb-5 border-4 border-forge-800 shadow-lg">
          {user.initials}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-1">{user.displayName}</h1>
        <p className="text-gray-400 mb-5">{user.email}</p>

        <div className="flex flex-wrap justify-center gap-3 mb-5">
          <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
            <div className="text-xs text-gray-400">Publisher Rank</div>
            <div className="font-bold text-gray-300 text-lg">—</div>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
            <div className="text-xs text-gray-400">Commenter Rank</div>
            <div className="font-bold text-gray-300 text-lg">—</div>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
            <div className="text-xs text-gray-400">Heat</div>
            <div className="font-bold text-gray-300 text-lg">—</div>
          </div>
        </div>

        <p className="text-gray-400 text-sm max-w-xl">
          This is your real account. Articles, comments, and satire will appear here once you publish them.
        </p>

        <button
          className="mt-4 text-sm text-forge-accent hover:text-orange-300 transition"
          type="button"
        >
          Add profile photo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-xs text-gray-400 mt-1">Articles</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-xs text-gray-400 mt-1">Article Views</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-xs text-gray-400 mt-1">Comments</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-xs text-gray-400 mt-1">Likes Received</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-forge-800 mb-6 text-sm font-medium overflow-x-auto justify-center md:justify-start">
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
        <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
          <p className="text-gray-300 font-medium mb-1">No articles yet</p>
          <p className="text-sm text-gray-500 mb-4">When you publish, your articles will show up here.</p>
          <Link href="/editor" className="text-sm text-forge-accent hover:text-orange-300 transition">
            Write an article →
          </Link>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="bg-forge-900 border border-forge-800 rounded-2xl p-10 text-center">
          <p className="text-gray-300 font-medium mb-1">No comments yet</p>
          <p className="text-sm text-gray-500">Comments you leave will appear here.</p>
        </div>
      )}

      {activeTab === "satire" && (
        <div className="bg-forge-900 border border-purple-500/20 rounded-2xl p-10 text-center">
          <p className="text-gray-300 font-medium mb-1">No satire yet</p>
          <p className="text-sm text-gray-500 mb-4">Your satire pieces will show up here.</p>
          <Link href="/fan-fiction" className="text-sm text-purple-300 hover:text-purple-200 transition">
            Write Satire →
          </Link>
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Log out
        </button>
      </div>
    </main>
  );
}
