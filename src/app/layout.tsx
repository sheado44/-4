import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import AuthNav from "./AuthNav";
import MobileNav from "./MobileNav";

export const metadata: Metadata = {
  title: "PressMe – Sports & Pop Culture",
  description: "Public sports and pop culture writing. Rankings driven by real engagement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-forge-950 text-gray-100 min-h-screen">
        <nav className="border-b border-forge-800/80 bg-forge-900/70 backdrop-blur sticky top-0 z-50 relative">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MobileNav />
              <Link href="/" className="text-xl font-bold tracking-tight">
                <span className="text-forge-accent">Press</span>
                <span className="text-white">Me</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Home
              </Link>
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Sports
              </Link>
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Pop Culture
              </Link>
              <Link href="/" className="text-gray-300 hover:text-white transition">
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

        <footer className="border-t border-forge-800/80 mt-16 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
            <p className="font-medium text-gray-400 mb-1">PressMe</p>
            <p>Sports & Pop Culture</p>
            <p className="mt-1 text-xs">pressme.ai</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
