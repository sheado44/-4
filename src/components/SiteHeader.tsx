"use client";

import Link from "next/link";
import AuthNav from "@/app/AuthNav";

export default function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--pit-bg) 92%, white 6%), var(--pit-bg))",
        borderColor: "rgba(127,127,127,0.22)",
        color: "var(--pit-text)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center shrink-0 group">
          <img
            src="/ballpit-wordmark.png"
            alt="The Ballpit"
            className="h-8 md:h-9 w-auto object-contain opacity-95 group-hover:opacity-100 transition"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}
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
              className="px-3 py-1.5 rounded-lg transition hover:opacity-100"
              style={{ color: "var(--pit-muted)" }}
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
