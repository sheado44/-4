"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center transition"
        aria-label="Open menu"
      >
        <span className="text-lg leading-none">{open ? "×" : "☰"}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-56 rounded-xl border border-white/10 bg-[#1f2937] shadow-xl p-2">
          <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">
            Home
          </Link>
          <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">
            Sports
          </Link>
          <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">
            Pop Culture
          </Link>
          <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">
            Satire
          </Link>

          {loggedIn && (
            <>
              <Link href="/editor" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">
                Write Article
              </Link>
              <Link href="/fan-fiction" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">
                Write Satire
              </Link>
            </>
          )}

          {!loggedIn && (
            <Link href="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">
              Log in / Sign up
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
