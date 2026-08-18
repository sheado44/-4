"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MAX_AI_ATTEMPTS = 3;

const SKINS = [
  { id: "solid", label: "Solid color", price: 0 },
  { id: "leopard", label: "Leopard", price: 100 },
  { id: "zebra", label: "Zebra", price: 100 },
  { id: "camo", label: "Camo", price: 100 },
  { id: "galaxy", label: "Galaxy", price: 100 },
  { id: "carbon", label: "Carbon", price: 100 },
] as const;

type SkinId = (typeof SKINS)[number]["id"];

function buildPreviewUrl(prompt: string, attempt: number) {
  const seed = `${prompt.trim().toLowerCase()}::attempt-${attempt}`;
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&size=256`;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [sex, setSex] = useState("");
  const [birthday, setBirthday] = useState("");
  const [location, setLocation] = useState("");
  const [points, setPoints] = useState(0);
  const [aiCredits, setAiCredits] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarColor, setAvatarColor] = useState("#7c3aed");
  const [avatarSkin, setAvatarSkin] = useState<SkinId>("solid");
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["solid"]);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAttempts, setAiAttempts] = useState(0);
  const [aiCandidates, setAiCandidates] = useState<string[]>([]);
  const [pendingAvatar, setPendingAvatar] = useState<string>("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "display_name, bio, link, sex, birthday, location, points, ai_credits, avatar_url, avatar_color, avatar_skin, owned_skins"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setLink(profile.link || "");
        setSex(profile.sex || "");
        setBirthday(profile.birthday || "");
        setLocation(profile.location || "");
        setPoints(profile.points ?? 0);
        setAiCredits(profile.ai_credits ?? 0);
        setAvatarUrl(profile.avatar_url || "");
        setAvatarColor(profile.avatar_color || "#7c3aed");
        setAvatarSkin((profile.avatar_skin as SkinId) || "solid");
        setOwnedSkins(
          Array.isArray(profile.owned_skins) && profile.owned_skins.length
            ? profile.owned_skins
            : ["solid"]
        );
      }

      setLoading(false);
    };
    boot();
  }, [router]);

  const generateAiAvatar = async () => {
    setMessage("");
    const text = aiPrompt.trim();
    if (!text) {
      setMessage("Describe how you look first.");
      return;
    }
    if (aiAttempts >= MAX_AI_ATTEMPTS) {
      setMessage("You’ve used all 3 attempts. Choose one below, then Save Profile.");
      return;
    }
    if (aiCredits < 1) {
      setMessage("Not enough AI credits.");
      return;
    }
    if (!userId) return;

    const nextAttempt = aiAttempts + 1;
    const url = buildPreviewUrl(text, nextAttempt);

    // spend 1 credit immediately
    const { error: creditError } = await supabase
      .from("profiles")
      .update({ ai_credits: aiCredits - 1 })
      .eq("id", userId);

    if (creditError) {
      setMessage(creditError.message);
      return;
    }

    setAiCredits((c) => c - 1);
    setAiAttempts(nextAttempt);
    setAiCandidates((prev) => [...prev, url]);
    setPendingAvatar(url);
    setMessage(
      `Attempt ${nextAttempt}/${MAX_AI_ATTEMPTS} generated. Click it to select, then Save Profile.`
    );
  };

  const buySkin = async (skinId: SkinId, price: number) => {
    if (!userId) return;
    if (ownedSkins.includes(skinId)) {
      setAvatarSkin(skinId);
      setMessage(`Equipped ${skinId}. Save Profile to keep it.`);
      return;
    }
    if (points < price) {
      setMessage("Not enough points.");
      return;
    }

    const nextPoints = points - price;
    const nextOwned = [...ownedSkins, skinId];

    const { error } = await supabase
      .from("profiles")
      .update({
        points: nextPoints,
        owned_skins: nextOwned,
        avatar_skin: skinId,
      })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPoints(nextPoints);
    setOwnedSkins(nextOwned);
    setAvatarSkin(skinId);
    setMessage(`Bought and equipped ${skinId}.`);
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
  };

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setMessage("");

    if (!displayName.trim()) {
      setMessage("Display name is required.");
      setSaving(false);
      return;
    }
    if (!birthday) {
      setMessage("Birthday is required.");
      setSaving(false);
      return;
    }

    const finalAvatar = pendingAvatar || avatarUrl;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        link: link.trim() || null,
        sex: sex || null,
        birthday,
        location: location.trim() || null,
        avatar_url: finalAvatar || null,
        avatar_color: avatarColor,
        avatar_skin: avatarSkin,
        owned_skins: ownedSkins,
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setAvatarUrl(finalAvatar);
    setPendingAvatar("");
    setMessage("Profile saved.");
    window.dispatchEvent(new Event("ballpit-wallet-updated"));
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-pit">
        Loading settings...
      </main>
    );
  }

  const previewSrc = pendingAvatar || avatarUrl;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--pit-text)" }}>
        Edit Profile
      </h1>
      <p className="text-sm text-muted-pit mb-6">
        Points available: {points} · AI credits: {aiCredits}
      </p>

      <div className="flex items-center gap-3 mb-6">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold"
            style={{ background: avatarColor }}
          >
            {(displayName || "U").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="text-sm text-muted-pit">
          {pendingAvatar ? "New AI avatar selected (save to keep)" : "Current avatar"}
        </div>
      </div>

      <div className="pit-panel p-4 mb-4 space-y-3">
        <div className="text-sm font-medium" style={{ color: "var(--pit-text)" }}>
          Generate AI profile photo
        </div>
        <p className="text-xs text-muted-pit">
          No uploads. Describe how you look. Up to 3 attempts this session. Each generate uses 1 AI
          credit. Choose one, then Save Profile.
        </p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={3}
          className="w-full rounded-xl px-3 py-2 text-sm"
          placeholder="What do you look like?"
        />
        <button
          type="button"
          onClick={generateAiAvatar}
          disabled={aiAttempts >= MAX_AI_ATTEMPTS || aiCredits < 1}
          className="btn-write px-4 py-2 rounded-xl text-sm disabled:opacity-50"
        >
          Generate profile photo (1 credit) · {MAX_AI_ATTEMPTS - aiAttempts} left
        </button>

        {aiCandidates.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            {aiCandidates.map((url, idx) => {
              const active = pendingAvatar === url;
              return (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setPendingAvatar(url)}
                  className="rounded-xl border p-2"
                  style={{
                    borderColor: active
                      ? "color-mix(in srgb, var(--pit-highlight) 60%, transparent)"
                      : "rgba(255,255,255,0.1)",
                    background: active
                      ? "color-mix(in srgb, var(--pit-highlight) 14%, transparent)"
                      : "rgba(0,0,0,0.15)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Attempt ${idx + 1}`} className="w-full rounded-lg" />
                  <div className="text-[10px] text-center mt-1 text-muted-pit">
                    {active ? "Selected" : `Try ${idx + 1}`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pit-panel p-4 mb-4">
        <div className="text-sm mb-2" style={{ color: "var(--pit-text)" }}>
          Comment / post avatar color
        </div>
        <input
          type="color"
          value={avatarColor}
          onChange={(e) => setAvatarColor(e.target.value)}
          className="w-12 h-10 rounded cursor-pointer"
        />
      </div>

      <div className="pit-panel p-4 mb-4">
        <div className="text-sm mb-2" style={{ color: "var(--pit-text)" }}>
          Equip / buy avatar skins
        </div>
        <p className="text-xs text-muted-pit mb-3">
          Owned skins can be equipped. Locked skins cost 100 pts.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SKINS.map((skin) => {
            const owned = ownedSkins.includes(skin.id);
            const equipped = avatarSkin === skin.id;
            return (
              <div
                key={skin.id}
                className="rounded-xl border border-white/10 p-3"
                style={{
                  background: equipped
                    ? "color-mix(in srgb, var(--pit-highlight) 12%, transparent)"
                    : "rgba(0,0,0,0.15)",
                }}
              >
                <div className="text-sm font-medium mb-2" style={{ color: "var(--pit-text)" }}>
                  {skin.label}
                </div>
                {owned ? (
                  <button
                    type="button"
                    onClick={() => setAvatarSkin(skin.id)}
                    className="text-xs px-2 py-1 rounded-lg btn-metal"
                  >
                    {equipped ? "Equipped" : "Equip"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => buySkin(skin.id, skin.price)}
                    className="text-xs px-2 py-1 rounded-lg btn-write"
                  >
                    Buy {skin.price} pts
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-muted-pit block mb-1">Display name *</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-pit block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-pit block mb-1">Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-pit block mb-1">Sex</label>
            <input
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-pit block mb-1">Birthday *</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-pit block mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={saveProfile}
        disabled={saving}
        className="btn-write px-5 py-2.5 rounded-xl text-sm disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>

      {message && <p className="text-sm text-yellow-500 mt-3">{message}</p>}

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/wallet" className="text-muted-pit hover:opacity-100">
          Wallet
        </Link>
        <Link href="/profile" className="text-muted-pit hover:opacity-100">
          Profile
        </Link>
      </div>
    </main>
  );
}
