"use client";

import Link from "next/link";
import AuthNav from "@/app/AuthNav";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 glass-strip">
      <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <img
            src="/ballpit-wordmark.png"
            alt="The Ballpit"
            className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] group-hover:brightness-110 transition"
          />
        </Link>

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
      <div className="pit-divider" />
    </header>
  );
}
