"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthNav() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarColor, setAvatarColor] = useState("#7c3aed");
  const [avatarKey, setAvatarKey] = useState(0);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setLoggedIn(false);
      setDisplayName("");
      setAvatarUrl("");
      setLoading(false);
      return;
    }

    setLoggedIn(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, avatar_color")
      .eq("id", user.id)
      .maybeSingle();

    setDisplayName(
      profile?.display_name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "User"
    );
    setAvatarUrl(profile?.avatar_url || "");
    setAvatarColor(profile?.avatar_color || "#7c3aed");
    setAvatarKey(Date.now());
    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    const onRefresh = () => loadUser();
    window.addEventListener("ballpit-wallet-updated", onRefresh);
    window.addEventListener("ballpit-profile-updated", onRefresh);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("ballpit-wallet-updated", onRefresh);
      window.removeEventListener("ballpit-profile-updated", onRefresh);
    };
  }, []);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return <span className="text-xs text-muted-pit">…</span>;
  }

  if (!loggedIn) {
    return (
      <Link href="/login" className="btn-write text-xs px-3 py-1.5 rounded-lg">
        Log in / Sign up
      </Link>
    );
  }

  const src = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarKey}`
    : "";

  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <Link
        href="/notifications"
        className="text-xs px-2 py-1 rounded-lg btn-metal"
        title="Notifications"
      >
        Alerts
      </Link>
      <Link href="/profile" className="flex items-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover border border-white/10 bg-black/20"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initials || "U"}
          </div>
        )}
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="text-[11px] text-muted-pit hover:opacity-100"
      >
        Out
      </button>
    </div>
  );
}
