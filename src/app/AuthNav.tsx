"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type NavUser = {
  initials: string;
};

export default function AuthNav() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);

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
        "U";

      const initials = displayName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      setUser({ initials });
      setLoading(false);
    };

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

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm text-gray-300 hover:text-white transition"
      >
        Log in / Sign up
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className="w-8 h-8 rounded-full bg-forge-700 hover:bg-forge-600 flex items-center justify-center text-xs font-bold transition"
      title="Profile"
    >
      {user.initials}
    </Link>
  );
}
