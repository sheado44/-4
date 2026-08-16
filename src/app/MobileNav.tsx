"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg bg-forge-800 hover:bg-forge-700 flex items-center justify-center transition"
        aria-label="Open menu"
      >
        <span className="text-lg leading-none">{open ? "×" : "☰"}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-56 rounded-xl border border-forge-800 bg-forge-900 shadow-xl p-2">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-forge-800 transition"
          >
            Home
          </Link>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-forge-800 transition"
          >
            Sports
          </Link>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-forge-800 transition"
          >
            Pop Culture
          </Link>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-forge-800 transition"
          >
            Satire
          </Link>
          <Link
            href="/editor"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-forge-800 transition"
          >
            Write Article
          </Link>
          <Link
            href="/fan-fiction"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-forge-800 transition"
          >
            Write Satire
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm hover:bg-forge-800 transition"
          >
            Log in / Sign up
          </Link>
        </div>
      )}
    </div>
  );
}
