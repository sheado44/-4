"use client";

import Link from "next/link";
import AuthNav from "@/app/AuthNav";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08]">
      {/* metallic sheen bar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 35%, rgba(0,0,0,0.25) 100%), linear-gradient(90deg, rgba(176,141,87,0.08), rgba(200,205,210,0.04), rgba(167,139,250,0.05))",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.05) 45%, transparent 60%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-4 bg-[#1E2022]/90 backdrop-blur-md">
        <Link href="/" className="flex items-center shrink-0 group">
          <img
            src="/ballpit-wordmark.png"
            alt="The Ballpit"
            className="h-8 md:h-9 w-auto object-contain mix-blend-screen opacity-95 group-hover:opacity-100 transition"
            style={{
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.45))",
            }}
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
              className="px-3 py-1.5 rounded-lg text-[#A7AEB4] hover:text-white hover:bg-white/5 transition"
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
    </header>
  );
}
