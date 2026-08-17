"use client";

import Link from "next/link";
import AuthNav from "@/app/AuthNav";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 glass-strip">
      <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-[radial-gradient(circle,rgba(196,122,74,0.25),transparent_70%)] opacity-70 group-hover:opacity-100 transition" />
            <img
              src="/ballpit-logo.png"
              alt="The Ballpit"
              className="relative h-8 w-8 md:h-9 md:w-9 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm md:text-base font-semibold tracking-wide">
              <span className="metal-title">The </span>
              <span className="copper-title font-bold">Ballpit</span>
            </div>
            <div className="hidden sm:block text-[10px] uppercase tracking-[0.22em] text-metal-steel">
              Sports · Culture · Satire
            </div>
          </div>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {[
            { href: "/", label: "Home" },
            { href: "/?section=Sports", label: "Sports" },
            { href: "/?section=Pop%20Culture", label: "Pop Culture" },
            { href: "/?section=Satire", label: "Satire" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-lg text-metal-aluminum hover:text-white hover:bg-white/5 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/editor"
            className="btn-write hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm"
          >
            Write
          </Link>
          <Link
            href="/fan-fiction"
            className="btn-metal hidden lg:inline-flex items-center px-3 py-1.5 rounded-xl text-xs"
          >
            Satire Lab
          </Link>
          <AuthNav />
        </div>
      </div>

      {/* subtle steel edge line */}
      <div className="pit-divider" />
    </header>
  );
}
