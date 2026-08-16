"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg bg-forge-800 hover:bg-forge-700 flex items-center justify-center transition"
        aria-label="Open menu"
      >
        <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-forge-800 bg-forge-900/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1 text-sm">
            <Link href="/" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-forge-800 transition">
              Home
            </Link>
            <Link href="/" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-forge-800 transition">
              Sports
            </Link>
            <Link href="/" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-forge-800 transition">
              Pop Culture
            </Link>
            <Link href="/" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-forge-800 transition">
              Satire
            </Link>
            <Link href="/editor" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-forge-800 transition">
              Write Article
            </Link>
            <Link href="/fan-fiction" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-purple-300 hover:bg-forge-800 transition">
              Write Satire
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-forge-800 transition">
              Log in / Sign up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
