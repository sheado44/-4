"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function WriteNavLink() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data.user));
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!loggedIn) return null;

  return (
    <Link
      href="/editor"
      className="text-white px-3.5 py-1.5 rounded-lg transition text-sm"
      style={{ background: "var(--ballpit-accent, #f97316)" }}
    >
      Write
    </Link>
  );
}
