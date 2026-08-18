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
  const [points, setPoints] = useState(0);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setLoggedIn(false);
      setDisplayName("");
      setAvatarUrl("");
      setPoints(0);
      setLoading(false);
      return;
    }

    setLoggedIn(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, avatar_color, points")
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
    setPoints(Number(profile?.points ?? 0));
    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    const onWallet = () => loadUser();
    window.addEventListener("ballpit-wallet-updated", onWallet);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("ballpit-wallet-updated", onWallet);
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

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10"
      style={{
        background: "color-mix(in srgb, var(--pit-panel) 92%, black 8%)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center min-w-0 shrink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/theballpit-wordmark.png"
            alt="theBallpit"
            className="h-8 md:h-10 w-auto max-w-[200px] md:max-w-[260px] object-contain object-left"
          />
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-pit">
          <Link href="/" className="hover:opacity-100">
            Home
          </Link>
          <Link href="/?section=Sports" className="hover:opacity-100">
            Sports
          </Link>
          <Link href="/?section=Pop%20Culture" className="hover:opacity-100">
            Pop Culture
          </Link>
          <Link href="/?section=Satire" className="hover:opacity-100">
            Satire
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {loading ? (
            <span className="text-xs text-muted-pit">…</span>
          ) : loggedIn ? (
            <>
              <Link href="/editor" className="btn-write text-xs px-3 py-1.5 rounded-lg">
                Write
              </Link>
              <Link href="/fan-fiction" className="btn-metal text-xs px-3 py-1.5 rounded-lg">
                Satire Lab
              </Link>
              <Link
                href="/wallet"
                className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-highlight-pit"
                title="Wallet"
              >
                {points} pts
              </Link>
              <Link href="/profile" className="flex items-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
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
            </>
          ) : (
            <Link href="/login" className="btn-write text-xs px-3 py-1.5 rounded-lg">
              Log in / Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
