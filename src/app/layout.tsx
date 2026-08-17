import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import AuthNav from "./AuthNav";
import MobileNav from "./MobileNav";
import { ThemeProvider } from "./ThemeProvider";
import VibeSwitcher from "./VibeSwitcher";

export const metadata: Metadata = {
  title: "The Ballpit – Sports & Pop Culture",
  description: "Public sports and pop culture writing. Rankings driven by real engagement.",
};

function BrandMark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-white">The B</span>
      <span style={{ color: "var(--ballpit-accent, #f97316)" }}>a</span>
      <span className="text-white">llp</span>
      <span style={{ color: "var(--ballpit-accent, #f97316)" }}>i</span>
      <span className="text-white">t</span>
    </span>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ThemeProvider>
          <nav className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-50 relative">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MobileNav />
                <Link href="/">
                  <BrandMark />
                </Link>
              </div>

              <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="/" className="text-gray-200 hover:text-white transition">
                  Home
                </Link>
                <Link href="/" className="text-gray-200 hover:text-white transition">
                  Sports
                </Link>
                <Link href="/" className="text-gray-200 hover:text-white transition">
                  Pop Culture
                </Link>
                <Link href="/" className="text-gray-200 hover:text-white transition">
                  Satire
                </Link>
                <Link
                  href="/editor"
                  className="text-white px-3.5 py-1.5 rounded-lg transition text-sm"
                  style={{ background: "var(--ballpit-accent, #f97316)" }}
                >
                  Write
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <VibeSwitcher />
                <AuthNav />
              </div>
            </div>
          </nav>

          {children}

          <footer className="border-t border-white/10 mt-16 py-8">
            <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-300">
              <p className="mb-1">
                <BrandMark className="text-base" />
              </p>
              <p>Sports & Pop Culture</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
