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

const PRESET_COLORS = [
  "#2563eb",
  "#f97316",
  "#16a34a",
  "#db2777",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#dc2626",
];

const SKINS = [
  { id: "none", label: "Solid color" },
  { id: "leopard", label: "Leopard" },
  { id: "zebra", label: "Zebra" },
  { id: "camo", label: "Camo" },
  { id: "galaxy", label: "Galaxy" },
  { id: "carbon", label: "Carbon" },
];

function parseOwned(owned: string | null | undefined) {
  return Array.from(
    new Set(
      (owned || "none")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function skinStyle(skin: string, color: string): React.CSSProperties {
  switch (skin) {
    case "leopard":
      return {
        backgroundColor: "#c2a36b",
        backgroundImage:
          "radial-gradient(circle at 20% 30%, #5b3a1a 0 8%, transparent 9%), radial-gradient(circle at 70% 40%, #5b3a1a 0 10%, transparent 11%), radial-gradient(circle at 40% 75%, #5b3a1a 0 7%, transparent 8%)",
      };
    case "zebra":
      return {
        backgroundImage:
          "repeating-linear-gradient(45deg, #111 0 8px, #f5f5f5 8px 16px)",
      };
    case "camo":
      return {
        backgroundColor: "#4b5320",
        backgroundImage:
          "radial-gradient(circle at 30% 30%, #2f3b1c 0 20%, transparent 21%), radial-gradient(circle at 70% 60%, #6b8e23 0 18%, transparent 19%), radial-gradient(circle at 50% 80%, #3d4c1f 0 16%, transparent 17%)",
      };
    case "galaxy":
      return {
        backgroundImage:
          "radial-gradient(circle at 20% 30%, #fff 0 1px, transparent 2px), radial-gradient(circle at 70% 40%, #fff 0 1px, transparent 2px), radial-gradient(circle at 40% 70%, #a78bfa 0 12%, transparent 13%), linear-gradient(135deg, #0f172a, #312e81)",
      };
    case "carbon":
      return {
        backgroundColor: "#1f2937",
        backgroundImage:
          "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
        backgroundSize: "8px 8px",
      };
    default:
      return { background: color };
  }
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
  const [commentAvatarColor, setCommentAvatarColor] = useState("#2563eb");
  const [commentAvatarSkin, setCommentAvatarSkin] = useState("none");
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["none"]);
  const [points, setPoints] = useState(0);
  const [aiCredits, setAiCredits] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [buyingSkin, setBuyingSkin] = useState<string | null>(null);
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
        .select(
          "display_name, bio, link, sex, birthday, location, avatar_url, comment_avatar_color, comment_avatar_skin, owned_skins, ai_credits, points"
        )
        .eq("id", user.id)
        .maybeSingle();

      setDisplayName(profile?.display_name || user.user_metadata?.display_name || "");
      setBio(profile?.bio || "");
      setLink(profile?.link || "");
      setSex(profile?.sex || "");
      setBirthday(profile?.birthday || "");
      setLocation(profile?.location || "");
      setAvatarUrl(profile?.avatar_url || "");
      setCommentAvatarColor(profile?.comment_avatar_color || "#2563eb");
      setCommentAvatarSkin(profile?.comment_avatar_skin || "none");
      setOwnedSkins(parseOwned(profile?.owned_skins));
      setAiCredits(profile?.ai_credits ?? 0);
      setPoints(profile?.points ?? 0);
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
      comment_avatar_color: commentAvatarColor,
      comment_avatar_skin: commentAvatarSkin,
      owned_skins: ownedSkins.join(","),
      updated_at: new Date().toISOString(),
    });
    if (error) setMessage(error.message);
    else {
      setMessage("Profile saved.");
      window.dispatchEvent(new Event("ballpit-wallet-updated"));
    }
    setSaving(false);
  };

  const buySkin = async (skinId: string, label: string) => {
    if (!userId) return;
    if (ownedSkins.includes(skinId)) return;
    if (points < 100) {
      setMessage("Need 100 points to buy this skin.");
      return;
    }

    const ok = window.confirm(`Spend 100 points to buy ${label}?`);
    if (!ok) return;

    setBuyingSkin(skinId);
    setMessage("");

    try {
      const newPoints = points - 100;
      const newOwned = Array.from(new Set([...ownedSkins, skinId]));

      const { error: ledgerError } = await supabase.from("points_ledger").insert({
        user_id: userId,
        points: -100,
        reason: `Redeemed: ${label} Skin`,
      });
      if (ledgerError) throw new Error(ledgerError.message);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          points: newPoints,
          owned_skins: newOwned.join(","),
          comment_avatar_skin: skinId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (updateError) throw new Error(updateError.message);

      setPoints(newPoints);
      setOwnedSkins(newOwned);
      setCommentAvatarSkin(skinId);
      setMessage(`Bought ${label} for 100 pts and equipped it.`);
      window.dispatchEvent(new Event("ballpit-wallet-updated"));
    } catch (err: any) {
      setMessage(err?.message || "Purchase failed.");
    } finally {
      setBuyingSkin(null);
    }
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
    await supabase.from("profiles").upsert({
      id: userId,
      avatar_url: data.publicUrl,
      updated_at: new Date().toISOString(),
    });
    setMessage("Profile picture saved.");
    setUploading(false);
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
    await supabase.from("profiles").upsert({
      id: userId,
      avatar_url: url,
      updated_at: new Date().toISOString(),
    });
    setMessage("AI avatar saved (placeholder provider). 1 credit used.");
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
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

  const initials = (displayName || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
      <p className="text-sm text-gray-300 mb-6">Points available: {points}</p>

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
            {initials}
          </div>
        )}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border border-white/10"
          style={skinStyle(commentAvatarSkin, commentAvatarColor)}
        >
          {initials}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) await uploadAvatarFile(file);
          }}
          className={`rounded-2xl border border-dashed p-5 text-center ${
            dragOver ? "border-forge-accent bg-forge-accent/10" : "border-forge-800 bg-forge-900"
          }`}
        >
          <p className="text-sm text-gray-200 mb-2">
            {uploading ? "Uploading..." : "Drag & drop profile photo"}
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await uploadAvatarFile(file);
            }}
          />
        </div>

        <div className="p-4 rounded-xl border border-forge-800 bg-forge-900">
          <div className="text-sm font-medium mb-2">Comment / post avatar color</div>
          <input
            type="color"
            value={commentAvatarColor}
            onChange={(e) => setCommentAvatarColor(e.target.value)}
            className="w-12 h-10 bg-transparent cursor-pointer mb-3"
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCommentAvatarColor(c)}
                className="w-7 h-7 rounded-full border border-white/20"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-forge-800 bg-forge-900">
          <div className="text-sm font-medium mb-2">Equip / buy avatar skins</div>
          <p className="text-xs text-gray-400 mb-3">
            Owned skins can be equipped. Locked skins can be bought for 100 pts.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SKINS.map((skin) => {
              const owned = ownedSkins.includes(skin.id) || skin.id === "none";
              const active = commentAvatarSkin === skin.id;
              return (
                <div
                  key={skin.id}
                  className={`rounded-xl border p-3 text-left text-sm ${
                    active ? "border-forge-accent bg-forge-accent/10" : "border-forge-800"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full mb-2 border border-white/10"
                    style={skinStyle(skin.id, commentAvatarColor)}
                  />
                  <div className="font-medium mb-2">{skin.label}</div>
                  {owned ? (
                    <button
                      type="button"
                      onClick={() => setCommentAvatarSkin(skin.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-black/20 hover:bg-black/30"
                    >
                      {active ? "Equipped" : "Equip"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={points < 100 || buyingSkin === skin.id}
                      onClick={() => buySkin(skin.id, skin.label)}
                      className="text-xs px-2 py-1 rounded-lg bg-forge-accent text-white disabled:opacity-50"
                    >
                      {buyingSkin === skin.id
                        ? "Buying..."
                        : points < 100
                        ? "Need 100 pts"
                        : "Buy 100 pts"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-forge-800 bg-forge-900">
          <label className="block text-sm text-gray-300 mb-1">Generate AI profile photo</label>
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your profile photo..."
            className="w-full bg-black/20 border border-forge-800 rounded-xl px-3 py-2 text-sm mb-2 outline-none"
          />
          <button
            type="button"
            onClick={generateAiAvatar}
            className="px-3 py-2 rounded-lg bg-forge-accent text-white text-sm"
          >
            Generate profile photo (1 credit)
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

      <div className="mt-8 flex gap-4">
        <Link href="/wallet" className="text-sm text-gray-300 hover:text-white">
          Wallet
        </Link>
        <Link href="/profile" className="text-sm text-gray-300 hover:text-white">
          Profile
        </Link>
      </div>
    </main>
  );
}
