"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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

export default function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");
  const [points, setPoints] = useState(0);
  const [avatarColor, setAvatarColor] = useState("#2563eb");
  const [avatarSkin, setAvatarSkin] = useState("none");
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setEmail(null);
      setInitials("?");
      setPoints(0);
      setAvatarColor("#2563eb");
      setAvatarSkin("none");
      setLoading(false);
      return;
    }

    setEmail(user.email ?? null);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, points, comment_avatar_color, comment_avatar_skin")
      .eq("id", user.id)
      .maybeSingle();

    const displayName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "U";

    setInitials(
      displayName
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    );
    setPoints(profile?.points ?? 0);
    setAvatarColor(profile?.comment_avatar_color || "#2563eb");
    setAvatarSkin(profile?.comment_avatar_skin || "none");
    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    const onFocus = () => loadUser();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadUser();
    };
    const onWallet = () => loadUser();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("ballpit-wallet-updated", onWallet);

    const interval = window.setInterval(loadUser, 8000);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("ballpit-wallet-updated", onWallet);
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-forge-800 animate-pulse" />;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-gray-200 hover:text-white transition"
      >
        Log in / Sign up
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/wallet"
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-forge-800 hover:border-forge-accent/50 transition"
        title="Your private wallet"
      >
        <span className="text-xs text-gray-300">Wallet</span>
        <span className="text-sm font-semibold text-forge-accent">{points} pts</span>
      </Link>

      <Link
        href="/wallet"
        className="sm:hidden text-xs font-semibold text-forge-accent"
        title="Your private wallet"
      >
        {points} pts
      </Link>

      <Link
        href="/profile"
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-90 transition border border-white/10"
        style={skinStyle(avatarSkin, avatarColor)}
        title={email}
      >
        {initials}
      </Link>
    </div>
  );
}
