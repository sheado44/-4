"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthNav() {
  // Prototype only — later this comes from real auth
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-forge-700 hover:bg-forge-600 flex items-center justify-center text-xs font-bold transition"
          title="Profile"
        >
          MS
        </Link>
        {/* Temporary toggle so you can test both states */}
        <button
          onClick={() => setIsLoggedIn(false)}
          className="text-[10px] text-gray-500 hover:text-gray-300"
          title="Prototype: switch to logged out"
        >
          (out)
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm text-gray-300 hover:text-white transition"
      >
        Log in / Sign up
      </Link>
      {/* Temporary toggle so you can test both states */}
      <button
        onClick={() => setIsLoggedIn(true)}
        className="text-[10px] text-gray-500 hover:text-gray-300"
        title="Prototype: switch to logged in"
      >
        (in)
      </button>
    </div>
  );
}
