import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import AuthNav from "./AuthNav";
import MobileNav from "./MobileNav";

export const metadata: Metadata = {
  title: "The Ballpit – Sports & Pop Culture",
  description: "Public sports and pop culture writing. Rankings driven by real engagement.",
};

function BrandMark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-white">The B</span>
      <span className="text-forge-accent">a</span>
      <span className="text-white">llp</span>
      <span className="text-forge-accent">i</span>
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
      <body className="bg-gray-500 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-400/40 bg-gray-600/80 backdrop-blur sticky top-0 z-50 relative">
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
                className="bg-forge-accent hover:bg-forge-accentHover text-white px-3.5 py-1.5 rounded-lg transition text-sm"
              >
                Write
              </Link>
            </div>

            <AuthNav />
          </div>
        </nav>

        {children}

        <footer className="border-t border-gray-400/40 mt-16 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-200">
            <p className="mb-1">
              <BrandMark className="text-base" />
            </p>
            <p className="text-gray-300">Sports & Pop Culture</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
