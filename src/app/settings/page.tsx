"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

function calcAge(birthday: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [sex, setSex] = useState("");
  const [birthday, setBirthday] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [aiCredits, setAiCredits] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, link, sex, birthday, location, avatar_url, ai_credits")
        .eq("id", user.id)
        .maybeSingle();

      setDisplayName(profile?.display_name || user.user_metadata?.display_name || "");
      setBio(profile?.bio || "");
      setLink(profile?.link || "");
      setSex(profile?.sex || "");
      setBirthday(profile?.birthday || "");
      setLocation(profile?.location || "");
      setAvatarUrl(profile?.avatar_url || "");
      setAiCredits(profile?.ai_credits ?? 0);
      setLoading(false);
    };
    load();
  }, []);

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setMessage("");

    const age = calcAge(birthday);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim(),
      bio: bio.trim(),
      link: link.trim(),
      sex: sex.trim(),
      birthday: birthday || null,
      age,
      location: location.trim(),
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    });

    if (error) setMessage(error.message);
    else setMessage("Profile saved.");
    setSaving(false);
  };

  const uploadAvatarFile = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Avatar must be an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Avatar must be under 5MB.");
      return;
    }

    setUploading(true);
    setMessage("");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatars/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("article-images")
      .upload(path, file, { upsert: true });

    if (error) {
      setMessage(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("article-images").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setMessage("Avatar uploaded. Click Save Profile to keep it.");
    setUploading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatarFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadAvatarFile(file);
  };

  const generateAiAvatar = async () => {
    if (!userId) return;
    if (aiCredits < 1) {
      setMessage("No AI credits left.");
      return;
    }
    if (!aiPrompt.trim() || aiPrompt.trim().length < 8) {
      setMessage("Write a clearer avatar prompt.");
      return;
    }

    const nextCredits = aiCredits - 1;
    const { error: creditError } = await supabase
      .from("profiles")
      .update({ ai_credits: nextCredits, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (creditError) {
      setMessage(creditError.message);
      return;
    }
    setAiCredits(nextCredits);

    const encoded = encodeURIComponent(aiPrompt.slice(0, 40));
    const url = `https://placehold.co/256x256/1f2937/f97316/png?text=${encoded}`;
    setAvatarUrl(url);
    setMessage("AI avatar set (placeholder provider). 1 credit used. Save profile to keep it.");
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-gray-300">Loading settings...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-3">Settings</h1>
        <Link href="/login" className="text-forge-accent">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

      <div className="flex items-center gap-4 mb-6">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border border-forge-800"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
            {(displayName || "U").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="text-sm text-gray-300">
          AI credits: <span className="text-white font-medium">{aiCredits}</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border border-dashed p-5 text-center transition ${
            dragOver
              ? "border-forge-accent bg-forge-accent/10"
              : "border-forge-800 bg-forge-900"
          }`}
        >
          <p className="text-sm text-gray-200 mb-2">
            {uploading ? "Uploading..." : "Drag & drop a profile picture here"}
          </p>
          <p className="text-xs text-gray-400 mb-3">or browse from your computer</p>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} />
        </div>

        <div className="p-4 rounded-xl border border-forge-800 bg-forge-900">
          <label className="block text-sm text-gray-300 mb-1">Or generate AI avatar</label>
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your avatar..."
            className="w-full bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm mb-2 outline-none"
          />
          <button
            type="button"
            onClick={generateAiAvatar}
            className="px-3 py-2 rounded-lg bg-forge-accent text-white text-sm"
          >
            Generate avatar (1 credit)
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full min-h-[90px] bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Sex</label>
            <input
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
      </div>

      <button
        onClick={saveProfile}
        disabled={saving || uploading}
        className="px-6 py-2.5 rounded-xl bg-forge-accent text-white text-sm font-medium disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>

      {message && <p className="mt-4 text-sm text-yellow-200">{message}</p>}

      <div className="mt-8">
        <Link href="/profile" className="text-sm text-gray-300 hover:text-white">
          ← Back to profile
        </Link>
      </div>
    </main>
  );
}
