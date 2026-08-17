"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setEmail(null);
      setInitials("?");
      setPoints(0);
      setLoading(false);
      return;
    }

    setEmail(user.email ?? null);

    const displayName =
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .maybeSingle();

    setPoints(profile?.points ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
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
        className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold hover:opacity-90 transition"
        title={email}
      >
        {initials}
      </Link>
    </div>
  );
}
