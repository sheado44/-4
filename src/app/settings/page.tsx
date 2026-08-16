"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, link")
        .eq("id", user.id)
        .maybeSingle();

      setDisplayName(
        profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          ""
      );
      setBio(profile?.bio || "");
      setLink(profile?.link || "");
      setLoading(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!userId) {
      setMessage("You must be logged in.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim() || "User",
      bio: bio.trim() || null,
      link: link.trim() || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(`Save failed: ${error.message}`);
    } else {
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() || "User" },
      });
      setMessage("Profile saved.");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-300 mb-4">Log in to edit your profile.</p>
        <Link href="/login" className="text-forge-accent">
          Log in
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Edit Profile</h1>
      <p className="text-sm text-gray-400 mb-6">
        Bio and link are optional. Link will be clickable on your public profile.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short bio..."
            className="w-full min-h-[120px] bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://your-site.com"
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Shown as a clickable link on your profile when filled out.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-forge-accent hover:bg-forge-accentHover text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
          <Link href="/profile" className="text-sm text-gray-400 hover:text-white">
            Cancel
          </Link>
        </div>

        {message && <p className="text-sm text-yellow-300">{message}</p>}
      </div>
    </main>
  );
}
